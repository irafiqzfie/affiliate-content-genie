import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import { getPlaceholderDataUrl, getErrorPlaceholderDataUrl } from '@/lib/placeholder-cache';

// Configure route timeout for image generation (60 seconds)
export const maxDuration = 60;

// Ensure the API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const imageGenModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

/**
 * Checks if we should skip image generation
 * Returns existing image URL if one matches conditions
 */
async function checkExistingImage(
  userId: string,
  prompt: string
): Promise<string | null> {
  try {
    // Simple check: look for recent images with similar conditions
    const recentImage = await prisma.imageMetadata.findFirst({
      where: {
        userId,
        prompt: prompt.substring(0, 100), // Store first 100 chars for matching
      },
      orderBy: { generatedAt: 'desc' },
      take: 1,
    });

    if (recentImage && recentImage.imageUrl) {
      console.log('✅ Found existing image, reusing:', recentImage.id);
      return recentImage.imageUrl;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Error checking existing image:', error);
    return null;
  }
}

/**
 * Stores image metadata for future reference
 */
async function storeImageMetadata(
  userId: string,
  imageUrl: string,
  prompt: string,
  imageType: string = 'generated'
): Promise<void> {
  try {
    await prisma.imageMetadata.create({
      data: {
        userId,
        imageUrl,
        imageType,
        prompt: prompt.substring(0, 500), // Store truncated prompt for reference
      },
    });
    console.log('📊 Stored image metadata for user:', userId);
  } catch (error) {
    console.warn('⚠️ Error storing image metadata:', error);
    // Don't throw - metadata storage is optional
  }
}

/**
 * Creates a concise, descriptive prompt for image search
 */
async function createImageSearchQuery(inputText: string): Promise<string> {
  const maxLength = 250;
  const truncatedText = inputText.length > maxLength ? inputText.substring(0, maxLength) + '...' : inputText;

  const prompt = `Based on this product description, generate ONLY 3-5 comma-separated keywords for finding a high-quality stock photo. 

Description: "${truncatedText}"

Return ONLY the keywords as comma-separated values, nothing else. Example format: keyword1,keyword2,keyword3

Keywords:`;

  try {
    const result = await visionModel.generateContent(prompt);
    const response = await result.response;
    let keywords = response.text().trim();

    keywords = keywords
      .replace(/^.*?:/g, '')
      .replace(/\*+/g, '')
      .replace(/^[\s\-•]+/gm, '')
      .split('\n')[0]
      .trim()
      .replace(/['"]/g, '')
      .replace(/\s+/g, '')
      .replace(/\./g, '');

    console.log('✨ Generated keywords for image:', keywords);
    return keywords;
  } catch (error) {
    console.error('Error generating keywords:', error);
    return 'product,modern,lifestyle';
  }
}

export async function POST(request: Request) {
  console.log('🎨 Image generation API (v2) called');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { prompt: outputText, conditionImage, transformation, skipExistingCheck } = body;

    if (!outputText) {
      return NextResponse.json({ message: 'Prompt (outputText) is required' }, { status: 400 });
    }

    // GUARD 1: Check for existing image (unless explicitly skipped)
    if (!skipExistingCheck) {
      const existingImageUrl = await checkExistingImage(
        userId,
        outputText
      );
      
      if (existingImageUrl) {
        console.log('♻️ Reusing existing image (guard activated)');
        return NextResponse.json({
          imageUrl: existingImageUrl,
          prompt: outputText.substring(0, 100) + '...',
          isExisting: true,
          note: 'Reused existing image (API call skipped)',
        });
      }
    }

    // Continue with image generation...
    // If a condition image is provided, use it as context for AI generation
    if (conditionImage) {
      console.log('🖼️ Using uploaded product image as context for AI generation');
      console.log('📝 Transformation type:', transformation || 'enhance');

      try {
        console.log('🚀 Starting image generation with Gemini 2.5 Flash Preview Image...');

        const base64Image = conditionImage.replace(/^data:image\/\w+;base64,/, '');
        const mimeTypeMatch = conditionImage.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

        // Analyze image first
        const analysisPrompt = `Analyze this product image briefly: what is the product, its color, and key features?`;

        const analysisResult = await visionModel.generateContent([
          analysisPrompt,
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ]);

        const imageAnalysis = (await analysisResult.response).text();
        console.log('📊 Image analysis:', imageAnalysis.substring(0, 150) + '...');

        // Generate new image
        const enhancedPrompt = `Create a professional product photograph: ${outputText}

Product details: ${imageAnalysis}

Requirements: Professional lighting, clean background, high-quality, NO watermarks or text overlays.`;

        console.log('🎨 Generating new image...');

        const imageResult = await imageGenModel.generateContent([
          enhancedPrompt,
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ]);

        const imageResponse = await imageResult.response;
        const parts = imageResponse.candidates?.[0]?.content?.parts;

        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              console.log('✅ Generated image successfully');
              const generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

              // Store metadata for future reference
              await storeImageMetadata(userId, generatedImage, outputText, 'generated');

              return NextResponse.json({
                imageUrl: generatedImage,
                prompt: outputText.substring(0, 100) + '...',
                isConditioned: true,
                note: 'AI-generated using Gemini 2.5 Flash Preview Image',
              });
            }
          }
        }

        throw new Error('No image in response');
      } catch (error) {
        console.error('❌ Image generation failed:', error);
        console.log('📌 Using original image as fallback');

        // Store fallback as well
        await storeImageMetadata(userId, conditionImage, outputText, 'generated');

        return NextResponse.json({
          imageUrl: conditionImage,
          prompt: outputText.substring(0, 100) + '...',
          isConditioned: true,
          error: error instanceof Error ? error.message : 'Unknown error',
          note: 'Fallback to original image',
        });
      }
    }

    console.log('📝 No uploaded image - creating placeholder');
    const searchQuery = await createImageSearchQuery(outputText);

    const cleanKeywords = searchQuery
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .join(',');

    console.log('🔍 Keywords extracted:', cleanKeywords);

    const placeholderDataUrl = getPlaceholderDataUrl(cleanKeywords);
    console.log('✅ Using placeholder data URL');

    // Store placeholder metadata
    await storeImageMetadata(userId, placeholderDataUrl, outputText, 'placeholder');

    return NextResponse.json({
      imageUrl: placeholderDataUrl,
      prompt: outputText.substring(0, 100) + '...',
      keywords: cleanKeywords,
      isConditioned: false,
      isPlaceholder: true,
    });
  } catch (error) {
    console.error('❌ Image generation error:', error);

    const errorDataUrl = getErrorPlaceholderDataUrl();
    console.log('✅ Using error placeholder data URL');

    return NextResponse.json({
      imageUrl: errorDataUrl,
      message: 'Using placeholder image due to generation error.',
      error: error instanceof Error ? error.message : 'Unknown error',
      isPlaceholder: true,
    });
  }
}
