import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // In a real application, you would use the productLink to scrape data
    // and then use another AI call to analyze it.
    // For this migration, we'll return mock data.
    const body = await request.json();
    const { productLink } = body;

    if (!productLink || !productLink.toLowerCase().includes('shopee')) {
         return NextResponse.json({ message: 'Invalid or missing Shopee product link.' }, { status: 400 });
    }

    // Mock analysis result
    const mockAnalysis = {
      category: 'Home & Living',
      audienceBuyerType: 'Home decor enthusiasts, Practical shoppers',
      toneAndStyle: 'Friendly & Informative',
      format: 'Problem–Solution',
      contentIntent: 'Showcase a useful and aesthetic home item.',
      narrativeStyle: 'Relatable, "life-hack" style.',
      callToActionStyle: 'Encourage viewers to upgrade their space.',
      trendscore: Math.floor(Math.random() * (95 - 70 + 1) + 70), // Random score between 70-95
      productSummary: "This is an automatically analyzed summary of the product. It appears to be a high-quality item with excellent user reviews, focusing on durability and ease of use. It solves the common problem of [mock problem].",
      productFeatures: [
          "Feature A from analysis",
          "Feature B identified by AI",
          "Benefit C that users love"
      ],
      affiliatePotential: "High"
    };

    return NextResponse.json(mockAnalysis);

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ message: 'Error analyzing product' }, { status: 500 });
  }
}
