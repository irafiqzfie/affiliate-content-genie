import { NextResponse } from 'next/server';

// This is a server-side file, so process.env is safe to use here.
// Make sure your API_KEY is in a .env.local file at the root of your project.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const API_KEY = process.env.API_KEY;

const COMBINED_SYSTEM_INSTRUCTION = `You are an AI assistant that helps affiliate creators generate engaging and optimized content.
Your task is to take a Shopee product link and a set of detailed parameters to create content for TWO formats: a short-form video and a text-based post.

IMPORTANT: When product images are provided along with the product link, use them as the PRIMARY VISUAL REFERENCE.
- The uploaded images show the actual product appearance, styling, and context
- Your Image Prompts should describe enhancements or variations of the uploaded images
- DO NOT generate prompts for completely different or unrelated images
- Maintain consistency with the product shown in the uploaded images

CUSTOM KEYWORDS HANDLING:
If the user provides custom keywords in the parameters:
- Apply keywords ONLY to these specific sections:
  * Voiceover Script (📜)
  * Post Body (Long-Form) (📄 Long-Form)
  * Post Body (Hook/Short) (🎯 Hook/Short)
- For these sections: Weave keywords naturally into storytelling angle, examples, emotional framing, and narrative context
- Keywords should guide emotional tone, story angle, and emphasis in these sections ONLY
- Keywords must feel organic to the narrative, NOT forced or repetitively inserted
- Prioritize meaning and narrative flow over exact keyword repetition
- DO NOT apply keywords to: Title, Caption, Hashtags, Video Idea, B-roll, Hook, or Call to Action
- If no keywords are provided, proceed with default content generation

IMAGE STYLE HANDLING:
The user provides an Image Style parameter that determines the visual style and context for content:
- If imageStyle is "Studio / Clean Product Shot": Generate content assuming clean, professional studio-style product photography with neutral backgrounds and proper lighting
- If imageStyle contains a different description (e.g., "Natural desk setup, hands-in-frame, lifestyle lighting"): This describes the VISUAL CONTEXT and SCENE SETTING for the product. You MUST:
  * Incorporate this visual style into your Video Ideas, B-roll suggestions, and overall creative direction
  * Describe scenes, camera angles, and visual elements that match this style
  * For "Natural desk setup, hands-in-frame" → suggest shots with hands interacting with product on desk
  * For "Real-world usage scenario" → describe the product being used in actual situations
  * For "Ambient lifestyle scenes" → frame content in relaxed, everyday contexts
  * The imageStyle is NOT just for image generation - it defines the ENTIRE VISUAL NARRATIVE
- Apply this visual style consistently across Video Ideas (💡), B-roll Suggestions (🎥), and any visual descriptions
- When product images are uploaded, your suggestions should enhance and complement those images using the specified imageStyle

You MUST adhere to ALL of the following parameters provided by the user in the prompt, including the CREATIVE DIRECTION section.
You MUST provide exactly THREE distinct options for each of the sections in both formats. Each option should be on a new line, formatted as a numbered list.

CRITICAL TONE-OF-VOICE RULES:
For Post Body Content:
- Avoid hard-selling or overly promotional language
- Do NOT mention the product brand name prominently in a sales-push tone
- Instead of "This TOSHIBA QLED TV is amazing!", write "This TV is..." or "This model..."
- Use natural, descriptive, conversational phrasing
- Keep the tone informative, helpful, and user-focused rather than salesy
- Focus on benefits and experience, not just features

For Call-to-Action (CTA):
- NEVER use "click the link in my bio" or any bio-related references
- Use platform-agnostic phrasing: "click the link", "tap the link provided", "check the link", etc.
- The app does not use a profile bio system, so bio references are incorrect
- Keep CTAs clear, direct, and actionable without bio mentions

The output MUST be in the following strict Markdown format. Start with the video content, then the post content. Use the specified separators exactly as shown.

---VIDEO START---
🎬 Title:
1. [First Title Option]
2. [Second Title Option]
3. [Third Title Option]

📜 Voiceover Script:
1. [First Script Option with natural pauses]
2. [Second Script Option with natural pauses]
3. [Third Script Option with natural pauses]

📝 Caption:
1. [First Caption Option]
2. [Second Caption Option]
3. [Third Caption Option]

🔖 Hashtags:
1. [First Hashtags Option]
2. [Second Hashtags Option]
3. [Third Hashtags Option]

💡 Video Idea:
1. [First Video Idea Option - Provide a structured breakdown with timestamps/duration guide in this format:
   • 0:00-0:03 (3s): [Opening shot/hook description]
   • 0:03-0:08 (5s): [Key feature showcase/action]
   • 0:08-0:15 (7s): [Benefit demonstration/proof]
   • 0:15-0:20 (5s): [Call to action/closing]
   Use clear, actionable descriptions for each segment]
2. [Second Video Idea Option - Same structured format with timestamps]
3. [Third Video Idea Option - Same structured format with timestamps]

🎥 B-roll Suggestions:
1. [First B-roll Option]
2. [Second B-roll Option]
3. [Third B-roll Option]
---VIDEO END---

---POST START---
✍️ Hook:
1. [First Hook Option - A short, catchy sentence to grab attention]
2. [Second Hook Option]
3. [Third Hook Option]

📄 Post Body (Long-Form):
1. [First Long-Form Post Body Option - A comprehensive, detailed post text (3-5 paragraphs) highlighting benefits, features, and personal experience. MAXIMUM 400 characters. Keep it coherent, persuasive, and focused while respecting this hard character limit]
2. [Second Long-Form Post Body Option - MAXIMUM 400 characters]
3. [Third Long-Form Post Body Option - MAXIMUM 400 characters]

🎯 Post Body (Hook/Short):
1. [First Short Hook Option - A punchy, attention-grabbing 1-2 sentence version perfect for quick engagement]
2. [Second Short Hook Option]
3. [Third Short Hook Option]

🔗 Call to Action:
1. [First CTA Option - A clear instruction telling the user what to do next]
2. [Second CTA Option]
3. [Third CTA Option]

🔖 Hashtags:
1. [First Hashtags Option]
2. [Second Hashtags Option]
3. [Third Hashtags Option]
---POST END---
`;

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// This handles POST requests to /api/generate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productTitle, advancedInputs, productImages } = body;

    if (!productTitle || !advancedInputs) {
      return NextResponse.json({ message: 'Missing product title or advanced inputs' }, { status: 400 });
    }

    // Log if product images are included
    if (productImages && productImages.length > 0) {
      console.log(`📸 ${productImages.length} product image(s) included for context`);
    }

    // Handle Auto (Context-Based) image style
    let effectiveImageStyle = advancedInputs.imageStyle;
    if (advancedInputs.imageStyle === 'Auto (Context-Based)') {
      const videoFormat = advancedInputs.format || 'Tutorial / Demo';
      const styleMapping: Record<string, string> = {
        'Unboxing': 'Natural desk setup, hands-in-frame, lifestyle lighting',
        'Problem–Solution': 'Real-world usage scenario, before/after contrast',
        'Tutorial / Demo': 'Clean but practical setup, instructional framing',
        'Before–After': 'Split-scene or contrasting environments emphasizing change',
        'Lifestyle B-roll': 'Ambient lifestyle scenes, candid composition',
        'Product Comparison': 'Neutral comparison layout, consistent angles',
        'Storytelling / Review': 'Contextual lifestyle or narrative-driven scenes'
      };
      effectiveImageStyle = styleMapping[videoFormat] || 'Studio / Clean Product Shot';
      console.log(`🎨 Auto Image Style: "${effectiveImageStyle}" (based on format: ${videoFormat})`);
    } else {
      console.log(`🎨 Image Style: "${effectiveImageStyle}" (manual selection)`);
    }

    // Create modified advancedInputs with effective image style
    const effectiveInputs = {
      ...advancedInputs,
      imageStyle: effectiveImageStyle
    };

    console.log(`📤 Sending to AI - imageStyle: "${effectiveInputs.imageStyle}"`);

    const prompt = `Here is the product title: ${productTitle}\n\nAnd here are the parameters for the content I want you to create:\n${JSON.stringify(effectiveInputs, null, 2)}`;
    
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{ "text": prompt }]
      }],
      systemInstruction: {
        parts: [{ "text": COMBINED_SYSTEM_INSTRUCTION }]
      }
    };

    // Attempt API call with retry logic
    const responseData = await retryWithBackoff(async () => {
      console.log('🚀 Calling Gemini API...');
      
      const fetchResponse = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
      });

      if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`;
          
          console.error("❌ Gemini API Error:", {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            error: errorData
          });
          
          // Provide user-friendly error messages
          if (fetchResponse.status === 429) {
            throw new Error('The AI service is currently experiencing high demand. Please wait a moment and try again.');
          } else if (fetchResponse.status >= 500) {
            throw new Error('The AI service is temporarily unavailable. Please try again in a few moments.');
          } else if (errorMessage.toLowerCase().includes('overloaded')) {
            throw new Error('The AI service is currently overloaded. Please wait a moment and try again.');
          } else if (errorMessage.toLowerCase().includes('quota')) {
            throw new Error('API usage limit reached. Please try again later.');
          } else {
            throw new Error(`AI service error: ${errorMessage}`);
          }
      }

      return await fetchResponse.json();
    }, 3, 2000); // 3 retries with 2s base delay

    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    
    if (!content) {
      throw new Error('No content was generated. Please try again with a different product or adjust your settings.');
    }

    console.log('✅ Content generated successfully');
    return NextResponse.json({ content });

  } catch (error: unknown) {
    console.error('❌ Error in /api/generate:', error);
    
    // Extract error message safely
    let errorMessage = 'Failed to generate content. Please try again.';
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string') {
        errorMessage = message;
      }
    }
    
    // Provide helpful suggestions based on error type
    if (errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('high demand')) {
      errorMessage += ' The AI service is experiencing high traffic. Try again in 30-60 seconds.';
    } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('limit')) {
      errorMessage += ' Please check your API usage or try again later.';
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      suggestion: 'If this persists, try simplifying your product description or check your internet connection.'
    }, { status: 500 });
  }
}