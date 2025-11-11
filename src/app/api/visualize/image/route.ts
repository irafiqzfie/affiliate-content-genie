import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Configure route timeout for image generation (60 seconds)
export const maxDuration = 60;

// Ensure the API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini 2.0 Flash for image generation and analysis
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const imageGenModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

/**
 * Creates a concise, descriptive prompt for image search
 * Used when no conditioning image is provided
 */
async function createImageSearchQuery(inputText: string): Promise<string> {
  const maxLength = 250;
  const truncatedText = inputText.length > maxLength ? inputText.substring(0, maxLength) + '...' : inputText;
  
  // Ask Gemini to extract the best keywords for finding a stock photo
  const prompt = `Based on this product description, generate ONLY 3-5 comma-separated keywords for finding a high-quality stock photo. 

Description: "${truncatedText}"

Return ONLY the keywords as comma-separated values, nothing else. Example format: keyword1,keyword2,keyword3

Keywords:`;

  try {
    const result = await visionModel.generateContent(prompt);
    const response = await result.response;
    let keywords = response.text().trim();
    
    // Clean up the keywords: remove any explanatory text, asterisks, bullets, etc.
    keywords = keywords
      .replace(/^.*?:/g, '') // Remove any text before colon
      .replace(/\*+/g, '') // Remove asterisks
      .replace(/^[\s\-•]+/gm, '') // Remove bullets and dashes
      .split('\n')[0] // Take only first line
      .trim()
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/\./g, ''); // Remove periods
    
    console.log('✨ Generated keywords for image:', keywords);
    return keywords;
  } catch (error) {
    console.error('Error generating keywords:', error);
    return 'product,modern,lifestyle';
  }
}

export async function POST(request: Request) {
  console.log('🎨 Image generation API called');
  try {
    const body = await request.json();
    const { prompt: outputText, conditionImage, transformation } = body;

    if (!outputText) {
      return NextResponse.json({ message: 'Prompt (outputText) is required' }, { status: 400 });
    }
    
    // If a condition image is provided, use Gemini for image analysis and generation
    if (conditionImage) {
      console.log('🖼️ Using uploaded product image for AI transformation');
      console.log('📝 Transformation type:', transformation || 'enhance');
      console.log('💡 Prompt:', outputText.substring(0, 100) + '...');
      
      try {
        console.log('🚀 Starting Gemini image analysis and generation...');
        
        // Step 1: Analyze the uploaded image with Gemini Vision
        console.log('🔍 Analyzing uploaded image...');
        const base64Image = conditionImage.replace(/^data:image\/\w+;base64,/, '');
        const mimeTypeMatch = conditionImage.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        
        const analysisPrompt = `Analyze this product image and extract key details:
1. What is the main product?
2. What are its key visual features (color, shape, material)?
3. What is the current background/setting?
4. What promotional elements or text overlays are present?

Be concise and factual.`;

        const analysisResult = await visionModel.generateContent([
          analysisPrompt,
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
        ]);
        
        const analysisResponse = await analysisResult.response;
        const imageAnalysis = analysisResponse.text();
        console.log('📊 Image analysis:', imageAnalysis.substring(0, 200) + '...');
        
        // Step 2: Create enhanced prompt combining analysis with desired output
        const enhancedPrompt = `Create a professional product photograph based on this description: ${outputText}

Product details from reference image: ${imageAnalysis}

Requirements:
- Professional studio lighting or natural lighting as specified
- Clean, uncluttered background
- High-quality, detailed render
- NO watermarks, sale badges, promotional text, or price tags
- Focus on the product
- 8K resolution quality
- Sharp focus and proper depth of field`;

        console.log('📝 Enhanced generation prompt:', enhancedPrompt.substring(0, 200) + '...');
        
        // Step 3: Generate new image with Gemini 2.5 Flash Image
        console.log('🎨 Generating new image with Gemini Image Model...');
        
        // Pass the original image along with the enhanced prompt for img2img transformation
        const imageResult = await imageGenModel.generateContent([
          enhancedPrompt,
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
        ]);
        
        const imageResponse = await imageResult.response;
        console.log('📦 Response received, extracting image...');
        
        // Extract generated image from response - check multiple possible locations
        const parts = imageResponse.candidates?.[0]?.content?.parts;
        
        if (parts) {
          console.log(`🔍 Found ${parts.length} part(s) in response`);
          
          for (const part of parts) {
            // Log what we found
            if (part.inlineData) {
              console.log('✅ Found inline image data');
              const generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              
              return NextResponse.json({ 
                imageUrl: generatedImage,
                prompt: outputText.substring(0, 100) + '...',
                isConditioned: true,
                transformation,
                analysis: imageAnalysis.substring(0, 200),
                note: 'AI-generated using Gemini 2.5 Flash Image'
              });
            } else if (part.text) {
              console.log('📝 Found text in response:', part.text.substring(0, 100));
            }
          }
        } else {
          console.error('❌ No parts found in response');
          console.error('Response structure:', JSON.stringify(imageResponse, null, 2).substring(0, 500));
        }
        
        throw new Error('No image generated in response');
        
      } catch (geminiError) {
        console.error('❌ Gemini transformation failed:', geminiError);
        console.error('❌ Error details:', {
          message: geminiError instanceof Error ? geminiError.message : 'Unknown error',
          stack: geminiError instanceof Error ? geminiError.stack : undefined,
          type: typeof geminiError,
          full: geminiError
        });
        console.log('📌 Falling back to original image');
        
        return NextResponse.json({ 
          imageUrl: conditionImage,
          prompt: outputText.substring(0, 100) + '...',
          isConditioned: true,
          transformation,
          error: geminiError instanceof Error ? geminiError.message : 'Unknown error',
          note: 'Gemini API error, returned original image'
        });
      }
    }
    
    console.log('📝 Generating placeholder image (no uploaded image provided)');
    
    // Generate smart keywords using Gemini
    const searchQuery = await createImageSearchQuery(outputText);
    
    // Clean keywords
    const cleanKeywords = searchQuery
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .join(',');
    
    // Create a consistent seed from the keywords for stable image selection
    let seed = 0;
    for (let i = 0; i < cleanKeywords.length; i++) {
      seed += cleanKeywords.charCodeAt(i);
    }
    
    // Use Lorem Picsum with seed for consistent, high-quality placeholder images
    const imageUrl = `https://picsum.photos/seed/${seed}/512/512`;

    console.log('✅ Image URL created:', imageUrl);
    console.log('🔍 Keywords used (for context):', cleanKeywords);
    console.log('📌 Using seed:', seed);

    return NextResponse.json({ 
      imageUrl,
      prompt: outputText.substring(0, 100) + '...',
      keywords: cleanKeywords,
      isConditioned: false
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    
    const fallbackImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
    
    return NextResponse.json({ 
      imageUrl: fallbackImageUrl,
      message: 'An error occurred during image generation.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
