import { NextResponse } from 'next/server';

// Ensure Stability AI API key is available
const stabilityApiKey = process.env.STABILITY_API_KEY;
if (!stabilityApiKey) {
  throw new Error('STABILITY_API_KEY is not defined in environment variables');
}

// Define the Stability AI endpoint and model
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';

// Creates a prompt suitable for Stability AI
function createEnhancedImagePrompt(inputText: string): string {
  const maxLength = 350;
  const truncatedText = inputText.length > maxLength ? inputText.substring(0, maxLength) + '...' : inputText;
  
  // Create a more artistic and descriptive prompt for better image results
  return `A high-quality, photorealistic image representing the following concept: "${truncatedText}". The style should be modern, clean, and suitable for marketing. Focus on a cinematic, professional look.`;
}

export async function POST(request: Request) {
  console.log('🎨 True AI Image Generation API called');
  try {
    const body = await request.json();
    const { prompt: outputText } = body;

    if (!outputText) {
      return NextResponse.json({ message: 'Prompt (outputText) is required' }, { status: 400 });
    }
    
    console.log('📝 Generating AI image from text:', outputText.substring(0, 100) + '...');
    
    const imagePrompt = createEnhancedImagePrompt(outputText);
    
    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: imagePrompt }],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Stability AI API error:', errorBody);
      throw new Error(`Stability AI API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const imageArtifact = responseData.artifacts[0];
    
    // The image is returned as a base64 string, so we create a data URL
    const imageUrl = `data:image/png;base64,${imageArtifact.base64}`;

    console.log('✅ AI Image generated successfully.');

    return NextResponse.json({ 
      imageUrl,
      prompt: outputText.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('❌ AI Image generation error:', error);
    
    const fallbackImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
    
    return NextResponse.json({ 
      imageUrl: fallbackImageUrl,
      message: 'An error occurred during AI image generation.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
