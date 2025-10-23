import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test with the UGREEN earbuds prompt
    const testPrompt = 'A sleek pair of UGREEN EchoBuds earbuds and their charging case with the touch screen clearly visible, placed on a modern, minimalist desk alongside study materials or a gaming setup. Soft, diffused lighting, aesthetic tech room vibe.';
    
    // Call our image generation API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/visualize/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testPrompt }),
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      testPrompt,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}