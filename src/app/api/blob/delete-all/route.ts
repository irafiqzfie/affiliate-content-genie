import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

/**
 * DELETE /api/blob/delete-all
 * 
 * Deletes all blobs in the current Vercel Blob store
 * Use this when you need to clear the store due to hitting limits
 */
export async function DELETE() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log('🗑️ Starting to delete all blobs...');

    // List all blobs
    const { blobs } = await list();
    
    console.log(`📋 Found ${blobs.length} blobs to delete`);

    if (blobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No blobs to delete',
        deletedCount: 0
      });
    }

    // Delete all blobs
    const deletePromises = blobs.map(blob => {
      console.log(`🗑️ Deleting: ${blob.url}`);
      return del(blob.url);
    });

    await Promise.all(deletePromises);

    console.log(`✅ Successfully deleted ${blobs.length} blobs`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${blobs.length} blobs`,
      deletedCount: blobs.length,
      deletedUrls: blobs.map(b => b.url)
    });

  } catch (error) {
    console.error('❌ Error deleting blobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete blobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blob/delete-all
 * 
 * Lists all blobs without deleting (for preview)
 */
export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured' },
        { status: 500 }
      );
    }

    const { blobs } = await list();
    
    return NextResponse.json({
      count: blobs.length,
      blobs: blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }))
    });

  } catch (error) {
    console.error('❌ Error listing blobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to list blobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
