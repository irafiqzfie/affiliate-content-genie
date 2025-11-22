import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

/**
 * POST /api/upload-image
 * 
 * Uploads a base64 image to Vercel Blob Storage and returns a public URL
 * This is needed for Threads API which requires publicly accessible image URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not configured');
      return NextResponse.json(
        { 
          error: 'Vercel Blob Storage not configured',
          details: 'BLOB_READ_WRITE_TOKEN environment variable is missing. Please connect your blob store in Vercel project settings.'
        },
        { status: 503 }
      );
    }

    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Check if it's a base64 data URL
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be a base64 data URL.' },
        { status: 400 }
      );
    }

    // Extract mime type and base64 data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid base64 image format' },
        { status: 400 }
      );
    }

    const extension = matches[1];
    const base64Data = matches[2];
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const filename = `threads-image-${Date.now()}.${extension}`;
    
    console.log(`📤 Uploading image to Vercel Blob: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: `image/${extension}`,
      addRandomSuffix: true,
    });

    console.log(`✅ Image uploaded successfully: ${blob.url}`);

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: buffer.length
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
