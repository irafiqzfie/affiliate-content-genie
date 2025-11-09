/**
 * Integration Examples for Image-to-Image APIs
 * 
 * This file provides ready-to-use integration examples for popular
 * image-to-image AI services. Choose one based on your needs and budget.
 */

// ============================================
// 1. STABILITY AI (Stable Diffusion)
// ============================================
// Best for: High-quality, customizable transformations
// Pricing: ~$0.002-0.01 per image
// Docs: https://platform.stability.ai/docs

export async function stabilityAIImg2Img(
  base64Image: string,
  prompt: string,
  strength: number = 0.35
) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY not configured');
  }

  // Remove data URL prefix
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        init_image: cleanBase64,
        init_image_mode: 'IMAGE_STRENGTH',
        image_strength: strength, // 0.0-1.0 (lower = closer to original)
        cfg_scale: 7, // How strongly to follow the prompt (1-35)
        samples: 1,
        steps: 30 // Quality vs speed tradeoff (10-150)
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stability AI error: ${error.message}`);
  }

  const result = await response.json();
  
  // Convert base64 result to data URL
  return {
    imageUrl: `data:image/png;base64,${result.artifacts[0].base64}`,
    seed: result.artifacts[0].seed
  };
}

// ============================================
// 2. OPENAI DALL-E (Variations & Edits)
// ============================================
// Best for: Quick variations, easy integration
// Pricing: $0.02 per 1024x1024 image
// Docs: https://platform.openai.com/docs/guides/images

export async function openAIDallEVariation(
  imageFile: File,
  size: '256x256' | '512x512' | '1024x1024' = '1024x1024'
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('n', '1');
  formData.append('size', size);

  const response = await fetch(
    'https://api.openai.com/v1/images/variations',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error.message}`);
  }

  const result = await response.json();
  return {
    imageUrl: result.data[0].url
  };
}

export async function openAIDallEEdit(
  imageFile: File,
  maskFile: File | null, // Optional: transparent areas to edit
  prompt: string,
  size: '256x256' | '512x512' | '1024x1024' = '1024x1024'
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  if (maskFile) {
    formData.append('mask', maskFile);
  }
  formData.append('prompt', prompt);
  formData.append('n', '1');
  formData.append('size', size);

  const response = await fetch(
    'https://api.openai.com/v1/images/edits',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error.message}`);
  }

  const result = await response.json();
  return {
    imageUrl: result.data[0].url
  };
}

// ============================================
// 3. REPLICATE (Multiple Models)
// ============================================
// Best for: Access to various models, flexible pricing
// Pricing: Varies by model (~$0.001-0.05 per image)
// Docs: https://replicate.com/docs

export async function replicateImg2Img(
  base64Image: string,
  prompt: string,
  modelVersion: string = 'stability-ai/sdxl:latest'
) {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  
  if (!REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_KEY not configured');
  }

  // Start prediction
  const prediction = await fetch(
    'https://api.replicate.com/v1/predictions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          image: base64Image,
          prompt: prompt,
          strength: 0.8,
          num_inference_steps: 30
        }
      })
    }
  );

  if (!prediction.ok) {
    const error = await prediction.json();
    throw new Error(`Replicate error: ${error.detail}`);
  }

  const predictionData = await prediction.json();
  
  // Poll for completion
  let result = predictionData;
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`
        }
      }
    );
    
    result = await statusResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(`Replicate failed: ${result.error}`);
  }

  return {
    imageUrl: result.output[0]
  };
}

// ============================================
// 4. INTEGRATION IN YOUR ROUTE
// ============================================
// Example: Update /api/visualize/image-to-image/route.ts

/**
 * Replace the placeholder logic in route.ts with:
 * 
import { stabilityAIImg2Img } from './integration-examples';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageData, prompt, transformation } = body;

    // Use Stability AI for actual transformation
    const result = await stabilityAIImg2Img(
      imageData,
      prompt || 'Enhance this product image with professional lighting and vibrant colors',
      0.35 // Strength: 0.35 = subtle enhancement
    );

    return NextResponse.json({
      success: true,
      originalImage: imageData,
      enhancedImage: result.imageUrl,
      metadata: {
        transformation,
        seed: result.seed
      }
    });
  } catch (error) {
    // Error handling...
  }
}
*/

// ============================================
// 5. HELPER FUNCTIONS
// ============================================

/**
 * Convert base64 data URL to File object (for OpenAI)
 */
export function base64ToFile(base64Data: string, filename: string = 'image.png'): File {
  const arr = base64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Determine optimal strength based on transformation type
 */
export function getOptimalStrength(transformationType: string): number {
  const strengthMap: Record<string, number> = {
    'enhance': 0.2,      // Subtle: color correction, sharpness
    'relight': 0.4,      // Moderate: lighting changes
    'background': 0.6,   // Strong: background replacement
    'style': 0.7,        // Strong: style transfer
    'generate': 0.9      // Very strong: major changes
  };
  
  return strengthMap[transformationType] || 0.5;
}

/**
 * Build enhanced prompt for better results
 */
export function buildEnhancedPrompt(
  basePrompt: string,
  transformationType: string
): string {
  const prefixes: Record<string, string> = {
    'enhance': 'Professional product photography: ',
    'relight': 'Studio lighting, dramatic shadows: ',
    'background': 'Product on lifestyle background: ',
    'style': 'Artistic style transfer: ',
    'generate': ''
  };
  
  const suffixes = ', high quality, detailed, professional, sharp focus, 8k';
  
  return `${prefixes[transformationType] || ''}${basePrompt}${suffixes}`;
}

// ============================================
// 6. USAGE EXAMPLES
// ============================================

/**
 * Example 1: Enhance uploaded product image
 */
export async function exampleEnhanceProductImage() {
  const uploadedImageBase64 = 'data:image/jpeg;base64,...';
  const prompt = 'Professional product photography with soft lighting and clean background';
  
  const result = await stabilityAIImg2Img(uploadedImageBase64, prompt, 0.3);
  console.log('Enhanced image:', result.imageUrl);
}

/**
 * Example 2: Create variation with OpenAI
 */
export async function exampleCreateVariation() {
  const imageFile = new File([/* blob */], 'product.jpg', { type: 'image/jpeg' });
  
  const result = await openAIDallEVariation(imageFile, '1024x1024');
  console.log('Variation URL:', result.imageUrl);
}

/**
 * Example 3: Background replacement with Replicate
 */
export async function exampleBackgroundReplacement() {
  const uploadedImageBase64 = 'data:image/jpeg;base64,...';
  const prompt = 'Product on minimalist white background, studio lighting';
  
  const result = await replicateImg2Img(uploadedImageBase64, prompt);
  console.log('New background:', result.imageUrl);
}
