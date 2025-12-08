import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { uploadToR2 } from '@/lib/r2';

/**
 * POST /api/upload-image
 * 
 * Uploads a base64 image to Cloudflare R2 (or Vercel Blob as fallback)
 * This is needed for Threads API which requires publicly accessible image URLs
 */
export async function POST(request: NextRequest) {
  try {
    const { imageData, useR2 = true } = await request.json();

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
    const contentType = `image/${extension}`;

    // NEW: Use Cloudflare R2 by default
    if (useR2 && process.env.R2_ACCOUNT_ID) {
      console.log(`📤 Uploading image to Cloudflare R2 (${(buffer.length / 1024).toFixed(2)} KB)`);
      
      try {
        const { publicUrl, fileKey } = await uploadToR2({
          buffer,
          contentType,
          folder: 'generated',
        });

        console.log(`✅ Image uploaded to R2: ${publicUrl}`);

        return NextResponse.json({
          success: true,
          url: publicUrl,
          fileKey,
          storage: 'r2',
          size: buffer.length,
        });
      } catch (r2Error) {
        console.error('⚠️ R2 upload failed, falling back to Vercel Blob:', r2Error);
        // Fall through to Vercel Blob
      }
    }

    // FALLBACK: Vercel Blob (for backward compatibility or if R2 not configured)
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ No storage configured (R2 failed and Blob token missing)');
      return NextResponse.json(
        { 
          error: 'Storage not configured',
          details: 'Neither R2 nor Vercel Blob is properly configured.'
        },
        { status: 503 }
      );
    }

    console.log(`📤 Uploading image to Vercel Blob (fallback) (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    const filename = `threads-image-${Date.now()}.${extension}`;
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    console.log(`✅ Image uploaded to Vercel Blob:`);
    console.log(`   URL: ${blob.url}`);
    console.log(`   Download URL: ${blob.downloadUrl}`);
    console.log(`   Pathname: ${blob.pathname}`);

    // Verify the image is accessible before returning
    console.log('🔍 Verifying Blob image accessibility...');
    const verifyResponse = await fetch(blob.url, { method: 'HEAD' });
    if (!verifyResponse.ok) {
      console.error(`⚠️ Blob image not immediately accessible: ${verifyResponse.status}`);
      console.log('⏳ Blob may need a few seconds to propagate. Returning URL anyway.');
    } else {
      console.log('✅ Blob image is accessible');
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      storage: 'vercel-blob',
      size: buffer.length,
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
