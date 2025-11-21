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
    
    // If a condition image is provided, use it directly
    // Note: AI image transformation is disabled - requires dedicated image generation API
    if (conditionImage) {
      console.log('🖼️ Using uploaded product image');
      console.log('💡 Note: Using original image (AI transformation requires dedicated image API)');
      
      return NextResponse.json({ 
        imageUrl: conditionImage,
        prompt: outputText.substring(0, 100) + '...',
        isConditioned: true,
        transformation: 'original',
        note: 'Using original uploaded image'
      });
    }
    
    console.log('📝 No uploaded image - creating placeholder');
    console.log('💡 Note: Text-to-image requires dedicated image generation API');
    
    // Generate smart keywords using Gemini
    const searchQuery = await createImageSearchQuery(outputText);
    
    // Clean keywords
    const cleanKeywords = searchQuery
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .join(',');
    
    console.log('🔍 Keywords extracted:', cleanKeywords);

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
