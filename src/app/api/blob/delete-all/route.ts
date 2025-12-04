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

    // Delete blobs in batches to avoid rate limits
    const BATCH_SIZE = 5;
    const DELAY_MS = 2000; // 2 seconds between batches
    
    let deletedCount = 0;
    const deletedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
      const batch = blobs.slice(i, i + BATCH_SIZE);
      
      console.log(`🗑️ Deleting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} blobs)...`);
      
      // Delete current batch
      const batchResults = await Promise.allSettled(
        batch.map(async (blob) => {
          try {
            await del(blob.url);
            return { success: true, url: blob.url };
          } catch (error) {
            return { 
              success: false, 
              url: blob.url, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      // Process results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            deletedCount++;
            deletedUrls.push(result.value.url);
            console.log(`✅ Deleted: ${result.value.url}`);
          } else {
            errors.push(`Failed to delete ${result.value.url}: ${result.value.error}`);
            console.error(`❌ Failed: ${result.value.url}`);
          }
        }
      });

      // Wait before next batch (except for the last batch)
      if (i + BATCH_SIZE < blobs.length) {
        console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log(`✅ Deletion complete: ${deletedCount}/${blobs.length} blobs deleted`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} out of ${blobs.length} blobs`,
      deletedCount,
      totalBlobs: blobs.length,
      deletedUrls,
      errors: errors.length > 0 ? errors : undefined
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
