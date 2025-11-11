import { NextResponse } from 'next/server';
import { parseShopeeProduct } from '@/lib/shopeeParser';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productLink, productTitle, customDescription } = body;

    // Validate that at least one input is provided
    if (!productLink && !productTitle && !customDescription) {
      return NextResponse.json({ 
        message: 'Please provide at least one of: Product Link, Product Title, or Custom Description.' 
      }, { status: 400 });
    }

    console.log('🔍 Analyzing product with:', { 
      hasLink: !!productLink, 
      hasTitle: !!productTitle, 
      hasDescription: !!customDescription 
    });

    // Parse Shopee product data if link is provided
    let shopeeData = null;
    let productName = productTitle || '';
    
    if (productLink && productLink.toLowerCase().includes('shopee')) {
      console.log('📦 Fetching public Shopee product data...');
      try {
        shopeeData = await parseShopeeProduct(productLink);
      } catch (error) {
        console.warn('⚠️ Failed to parse Shopee data:', error);
      }

      // Extract product name from URL if not manually provided
      if (!productName) {
        const urlParts = productLink.split('/');
        const productSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
        productName = decodeURIComponent(productSlug)
          .replace(/-/g, ' ')
          .replace(/\?.*/, '')
          .replace(/i\.\d+\.\d+/, '')
          .trim();
      }
    }

    // Build analysis prompt based on available information
    let analysisPrompt = `Analyze this product and provide affiliate content recommendations:\n\n`;
    
    if (productLink) {
      analysisPrompt += `Product URL: ${productLink}\n`;
    }
    if (productName) {
      analysisPrompt += `Product Name/Title: ${productName}\n`;
    }
    if (customDescription) {
      analysisPrompt += `Product Description: ${customDescription}\n`;
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
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: analysisPrompt }]
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
    
    // Include parsed Shopee data in the response
    const finalResponse = {
      ...analysisResult,
      shopeeProductInfo: shopeeData || undefined,
    };
    
    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('❌ Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    );
  }
}
