import { NextResponse } from 'next/server';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productTitle, customDescription, productImages } = body;

    // Validate that at least one input is provided
    if (!productTitle && !customDescription && (!productImages || productImages.length === 0)) {
      return NextResponse.json({ 
        message: 'Please provide at least one of: Product Title, Custom Description, or Product Images.' 
      }, { status: 400 });
    }

    console.log('🔍 Analyzing product with:', { 
      hasTitle: !!productTitle, 
      hasDescription: !!customDescription,
      hasImages: !!productImages && productImages.length > 0
    });

    // Use product title as product name
    const productName = productTitle || '';

    // Build analysis prompt based on available information
    let analysisPrompt = `Analyze this product and provide affiliate content recommendations:\n\n`;
    
    if (productName) {
      analysisPrompt += `Product Name/Title: ${productName}\n`;
    }
    if (customDescription) {
      analysisPrompt += `Product Description: ${customDescription}\n`;
    }
    if (productImages && productImages.length > 0) {
      analysisPrompt += `Product Images: ${productImages.length} image(s) provided\n`;
      analysisPrompt += `(Note: Analyze visual content if images are available for enhanced recommendations)\n`;
    }

    analysisPrompt += `\nBased on the provided information, provide a JSON response with the following structure:
{
  "category": "one of: Tech, Home & Living, Beauty, Fashion, Kitchen, Sports, Baby, Books",
  "audienceBuyerType": "brief description of target buyer persona",
  "toneAndStyle": "one of: Fun / Casual, Professional, Minimalist, Trendy / Gen-Z, Luxury / Premium, Emotional / Heartwarming, Friendly & Informative, Trustworthy & Direct",
  "format": "one of: Unboxing, Problem–Solution, Tutorial / Demo, Before–After, Lifestyle B-roll, Product comparison, Storytelling / Review",
  "contentIntent": "brief content strategy recommendation",
  "narrativeStyle": "brief narrative approach recommendation",
  "callToActionStyle": "brief CTA recommendation",
  "trendscore": number between 60-95,
  "productSummary": "2-3 sentence product summary highlighting key benefits",
  "productFeatures": ["feature1", "feature2", "feature3"],
  "affiliatePotential": "one of: High, Medium, Low"
}

Provide ONLY valid JSON, no additional text.`;

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
    
    // Build the request parts with text and optional images
    const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: analysisPrompt }
    ];
    
    // Add images to the request if provided (support for vision analysis)
    if (productImages && productImages.length > 0) {
      for (const imageUrl of productImages.slice(0, 3)) { // Limit to first 3 images
        // If it's a base64 data URL, extract the data
        if (imageUrl.startsWith('data:image/')) {
          const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (matches) {
            contentParts.push({
              inlineData: {
                mimeType: `image/${matches[1]}`,
                data: matches[2]
              }
            });
          }
        }
        // For regular URLs, we'd need to fetch and convert them
        // Skipping for now as it adds complexity
      }
    }
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: contentParts
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from the response
    let analysisResult;
    try {
      // Try to parse the response as JSON directly
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to basic analysis
      const fallbackSummary = customDescription 
        ? customDescription 
        : productName 
          ? `This product offers great value for money: ${productName}` 
          : 'This product offers great value for money.';
      
      analysisResult = {
        category: 'Tech',
        audienceBuyerType: 'Tech enthusiasts, Value seekers',
        toneAndStyle: 'Friendly & Informative',
        format: 'Problem–Solution',
        contentIntent: 'Highlight product benefits and value',
        narrativeStyle: 'Relatable, authentic style',
        callToActionStyle: 'Encourage viewers to check it out',
        trendscore: 75,
        productSummary: fallbackSummary,
        productFeatures: [
          'Quality construction',
          'Good user reviews',
          'Competitive pricing'
        ],
        affiliatePotential: 'Medium'
      };
    }

    console.log('✅ Analysis completed:', analysisResult);
    
    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('❌ Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    );
  }
}
