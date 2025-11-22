import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

/**
 * GET /api/test-blob
 * 
 * Tests Vercel Blob Storage connection
 */
export async function GET() {
  try {
    // Check if environment variable exists
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!hasToken) {
      return NextResponse.json({
        success: false,
        error: 'BLOB_READ_WRITE_TOKEN environment variable is not set',
        message: 'Please add BLOB_READ_WRITE_TOKEN to your Vercel project environment variables',
        instructions: [
          '1. Go to your Vercel dashboard',
          '2. Select your project',
          '3. Go to Settings > Storage',
          '4. Connect your blob store (affiliate-content-genie-blob)',
          '5. The BLOB_READ_WRITE_TOKEN will be automatically added'
        ]
      });
    }

    // Try to upload a small test image
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');
    
    const blob = await put(`test-${Date.now()}.png`, buffer, {
      access: 'public',
      contentType: 'image/png'
    });

    return NextResponse.json({
      success: true,
      message: 'Vercel Blob Storage is connected and working!',
      testUpload: {
        url: blob.url,
        downloadUrl: blob.downloadUrl
      },
      tokenPresent: true
    });
  } catch (error) {
    console.error('Blob test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to Vercel Blob Storage',
      details: String(error)
    }, { status: 500 });
  }
}
