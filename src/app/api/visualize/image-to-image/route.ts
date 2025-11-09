import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Ensure the API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini 2.0 Flash Experimental for vision capabilities
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

/**
 * Image-to-Image API Route
 * This endpoint accepts an uploaded product image and generates variations or enhancements
 * based on the provided instructions while maintaining the core subject and context.
 */
export async function POST(request: Request) {
  console.log('🎨 Image-to-Image API called');
  
  try {
    const body = await request.json();
    const { imageData, prompt, transformation } = body;

    if (!imageData) {
      return NextResponse.json(
        { message: 'Image data is required' }, 
        { status: 400 }
      );
    }

    // Default transformation instruction if none provided
    const defaultInstruction = `Generate an image based on the content and style of the uploaded photo. 
Use the uploaded image as the primary source. The output should closely resemble or be derived from the uploaded image. 
Maintain the subject and context of the original image.`;

    const transformationInstruction = transformation || defaultInstruction;

    console.log('📝 Transformation instruction:', transformationInstruction);

    // Prepare the image data for Gemini API
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Determine the mime type from the data URL or default to jpeg
    const mimeTypeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    // Create a comprehensive prompt for image analysis and enhancement
    const analysisPrompt = `${transformationInstruction}

${prompt ? `Additional instructions: ${prompt}` : ''}

Analyze this product image and provide:
1. A detailed description of the main subject and its key features
2. The overall style, lighting, and composition
3. Specific elements that should be preserved
4. Suggestions for enhancement while maintaining authenticity

Format your response as:
SUBJECT: [description]
STYLE: [style details]
PRESERVE: [elements to keep]
ENHANCE: [enhancement suggestions]`;

    // Call Gemini Vision API to analyze the image
    const result = await visionModel.generateContent([
      analysisPrompt,
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const analysisText = response.text();
    
    console.log('✅ Image analysis completed');
    console.log('📊 Analysis:', analysisText.substring(0, 200) + '...');

    // Extract structured information from the analysis
    const subjectMatch = analysisText.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
    const styleMatch = analysisText.match(/STYLE:\s*(.+?)(?:\n|$)/i);
    const preserveMatch = analysisText.match(/PRESERVE:\s*(.+?)(?:\n|$)/i);
    const enhanceMatch = analysisText.match(/ENHANCE:\s*(.+?)(?:\n|$)/i);

    const analysis = {
      subject: subjectMatch?.[1]?.trim() || 'Product',
      style: styleMatch?.[1]?.trim() || 'Professional photography',
      preserve: preserveMatch?.[1]?.trim() || 'Original subject and composition',
      enhance: enhanceMatch?.[1]?.trim() || 'Color vibrancy and clarity'
    };

    // For now, we return the original image URL with analysis
    // In a production environment, you would integrate with an image generation API
    // that supports img2img (e.g., Stability AI, Replicate, etc.)
    
    // Create a placeholder enhanced image using the original as a base
    // In production, this would be replaced with actual img2img API call
    const enhancedImageUrl = imageData; // For now, return the original

    return NextResponse.json({ 
      success: true,
      originalImage: imageData,
      enhancedImage: enhancedImageUrl,
      analysis,
      metadata: {
        transformation: transformationInstruction,
        customPrompt: prompt || null,
        processingNote: 'Image analyzed successfully. For actual transformation, integrate with Stable Diffusion img2img or similar API.'
      }
    });

  } catch (error) {
    console.error('❌ Image-to-Image error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Failed to process image',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Ensure the image is properly formatted and try again.'
    }, { status: 500 });
  }
}
