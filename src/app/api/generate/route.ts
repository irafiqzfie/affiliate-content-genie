import { NextResponse } from 'next/server';

// This is a server-side file, so process.env is safe to use here.
// Make sure your API_KEY is in a .env.local file at the root of your project.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const API_KEY = process.env.API_KEY;

const COMBINED_SYSTEM_INSTRUCTION = `You are an AI assistant that helps affiliate creators generate engaging and optimized content.
Your task is to take a Shopee product link and a set of detailed parameters to create content for TWO formats: a short-form video and a text-based post.

You MUST adhere to ALL of the following parameters provided by the user in the prompt, including the CREATIVE DIRECTION section.
You MUST provide exactly THREE distinct options for each of the sections in both formats. Each option should be on a new line, formatted as a numbered list.

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
1. [First Video Idea Option]
2. [Second Video Idea Option]
3. [Third Video Idea Option]

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

📄 Post Body:
1. [First Post Body Option - The main text of the post, highlighting benefits and features]
2. [Second Post Body Option]
3. [Third Post Body Option]

🔗 Call to Action:
1. [First CTA Option - A clear instruction telling the user what to do next]
2. [Second CTA Option]
3. [Third CTA Option]

🔖 Hashtags:
1. [First Hashtags Option]
2. [Second Hashtags Option]
3. [Third Hashtags Option]

🖼️ Image Prompt:
1. [First Image Prompt - A descriptive prompt for an AI image generator to create a visually appealing product image]
2. [Second Image Prompt]
3. [Third Image Prompt]
---POST END---
`;

// This handles POST requests to /api/generate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productLink, advancedInputs } = body;

    if (!productLink || !advancedInputs) {
      return NextResponse.json({ message: 'Missing product link or advanced inputs' }, { status: 400 });
    }

    const prompt = `Here is the product link: ${productLink}\n\nAnd here are the parameters for the content I want you to create:\n${JSON.stringify(advancedInputs, null, 2)}`;
    
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{ "text": prompt }]
      }],
      systemInstruction: {
        parts: [{ "text": COMBINED_SYSTEM_INSTRUCTION }]
      }
    };

    const fetchResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        console.error("Gemini API Error:", errorData.error);
        throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
    }

    const responseData = await fetchResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Send the response back to the client
    return NextResponse.json({ content });

  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json({ message: error.message || 'Error generating content' }, { status: 500 });
  }
}