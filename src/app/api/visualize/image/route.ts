import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Ensure the API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini 2.0 Flash for keyword extraction
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Creates a concise, descriptive prompt for image search
async function createImageSearchQuery(inputText: string): Promise<string> {
  const maxLength = 250;
  const truncatedText = inputText.length > maxLength ? inputText.substring(0, maxLength) + '...' : inputText;
  
  // Ask Gemini to extract the best keywords for finding a stock photo
  const prompt = `Based on this product description, generate ONLY 3-5 comma-separated keywords for finding a high-quality stock photo. 

Description: "${truncatedText}"

Return ONLY the keywords as comma-separated values, nothing else. Example format: keyword1,keyword2,keyword3

Keywords:`;

  try {
    const result = await model.generateContent(prompt);
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
  console.log('🎨 Image generation API called (using Gemini)');
  try {
    const body = await request.json();
    const { prompt: outputText } = body;

    if (!outputText) {
      return NextResponse.json({ message: 'Prompt (outputText) is required' }, { status: 400 });
    }
    
    console.log('📝 Generating image search query from text:', outputText.substring(0, 100) + '...');
    
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
      keywords: cleanKeywords
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
