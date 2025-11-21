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

// Use Gemini 2.5 Flash for both text analysis and image generation
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const imageGenModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    
    // If a condition image is provided, use it as context for AI generation
    if (conditionImage) {
      console.log('🖼️ Using uploaded product image as context for AI generation');
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
        
        // Step 3: Generate new image with Gemini 2.5 Flash
        console.log('🎨 Generating new image with Gemini 2.5 Flash...');
        
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
        
        // Extract generated image from response
        const parts = imageResponse.candidates?.[0]?.content?.parts;
        
        if (parts) {
          console.log(`🔍 Found ${parts.length} part(s) in response`);
          
          for (const part of parts) {
            if (part.inlineData) {
              console.log('✅ Found inline image data');
              const generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              
              return NextResponse.json({ 
                imageUrl: generatedImage,
                prompt: outputText.substring(0, 100) + '...',
                isConditioned: true,
                transformation,
                analysis: imageAnalysis.substring(0, 200),
                note: 'AI-generated using Gemini 2.5 Flash'
              });
            } else if (part.text) {
              console.log('📝 Found text in response:', part.text.substring(0, 100));
            }
          }
        } else {
          console.error('❌ No parts found in response');
        }
        
        throw new Error('No image generated in response');
        
      } catch (geminiError) {
        console.error('❌ Image generation failed:', geminiError);
        console.log('📌 Falling back to original image');
        
        return NextResponse.json({ 
          imageUrl: conditionImage,
          prompt: outputText.substring(0, 100) + '...',
          isConditioned: true,
          transformation,
          error: geminiError instanceof Error ? geminiError.message : 'Unknown error',
          note: 'Imagen API error, returned original image'
        });
      }
    }
    
    console.log('📝 No uploaded image - generating from text prompt');
    
    // Generate smart keywords using Gemini
    const searchQuery = await createImageSearchQuery(outputText);
    
    // Clean keywords
    const cleanKeywords = searchQuery
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .join(',');
    
    console.log('🔍 Keywords extracted:', cleanKeywords);

    try {
      // Use Gemini 2.5 Flash to generate from text prompt alone
      const imagePrompt = `Create a professional, high-quality product photograph for: ${outputText.substring(0, 500)}

Keywords: ${cleanKeywords}

Requirements:
- Professional studio lighting or lifestyle setting
- Clean, modern composition
- High-quality, detailed render
- NO watermarks, text overlays, or promotional badges
- 8K resolution quality
- Sharp focus and proper depth of field
- Commercial product photography style`;

      console.log('🚀 Calling Gemini 2.5 Flash for text-to-image generation...');
      
      const imageResult = await imageGenModel.generateContent(imagePrompt);
      const imageResponse = await imageResult.response;
      
      console.log('📦 Response received, extracting generated image...');
      
      // Extract generated image from response
      const parts = imageResponse.candidates?.[0]?.content?.parts;
      
      if (parts) {
        console.log(`🔍 Found ${parts.length} part(s) in response`);
        
        for (const part of parts) {
          if (part.inlineData) {
            console.log('✅ Found inline image data from Gemini 2.5 Flash');
            const generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            
            return NextResponse.json({ 
              imageUrl: generatedImage,
              prompt: outputText.substring(0, 100) + '...',
              keywords: cleanKeywords,
              isConditioned: false,
              note: 'AI-generated using Gemini 2.5 Flash (text-to-image)'
            });
          } else if (part.text) {
            console.log('📝 Found text in response:', part.text.substring(0, 100));
          }
        }
      }
      
      console.warn('⚠️ No image in Imagen response, creating placeholder');
      throw new Error('Imagen did not return an image');
      
    } catch (imagenError) {
      console.error('❌ Imagen text-to-image failed:', imagenError);
      console.warn('⚠️ Falling back to SVG placeholder');
    }

    // Create a simple colored SVG placeholder
    const svgPlaceholder = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#6366f1"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        ${cleanKeywords.substring(0, 30)}
      </text>
    </svg>`;
    
    // Convert SVG to base64
    const base64Svg = Buffer.from(svgPlaceholder).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    // Upload to Vercel Blob so it's accessible to Threads API
    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: dataUrl })
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload placeholder image to Vercel Blob');
    }

    const { url: imageUrl } = await uploadResponse.json();

    console.log('✅ Placeholder uploaded to Vercel Blob:', imageUrl);

    return NextResponse.json({ 
      imageUrl,
      prompt: outputText.substring(0, 100) + '...',
      keywords: cleanKeywords,
      isConditioned: false,
      isPlaceholder: true
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    
    // Create a simple error placeholder and upload to Vercel Blob
    const svgError = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#ef4444"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">
        Image Generation Failed
      </text>
    </svg>`;
    
    const base64Svg = Buffer.from(svgError).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    try {
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: dataUrl })
      });

      if (uploadResponse.ok) {
        const { url: fallbackImageUrl } = await uploadResponse.json();
        return NextResponse.json({ 
          imageUrl: fallbackImageUrl,
          message: 'Using placeholder image due to generation error.',
          error: error instanceof Error ? error.message : 'Unknown error',
          isPlaceholder: true
        });
      }
    } catch (uploadError) {
      console.error('Failed to upload error placeholder:', uploadError);
    }

    return NextResponse.json({ 
      imageUrl: null,
      message: 'Image generation failed and placeholder upload failed.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
