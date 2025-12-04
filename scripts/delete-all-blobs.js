// Script to delete all blobs from Vercel Blob storage
// Run with: node scripts/delete-all-blobs.js

require('dotenv').config({ path: '.env.local' });

const { list, del } = require('@vercel/blob');

async function deleteAllBlobs() {
  try {
    // Check if token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in .env.local');
      console.log('\nPlease ensure your .env.local file contains:');
      console.log('BLOB_READ_WRITE_TOKEN=your_token_here\n');
      process.exit(1);
    }

    console.log('🔍 Listing all blobs...');
    
    // List all blobs
    const { blobs } = await list();
    
    console.log(`📋 Found ${blobs.length} blobs to delete\n`);

    if (blobs.length === 0) {
      console.log('✅ No blobs to delete');
      return;
    }

    // Delete in batches to avoid rate limits
    const BATCH_SIZE = 3;
    const DELAY_MS = 3000; // 3 seconds between batches
    
    let deletedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
      const batch = blobs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(blobs.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} blobs)...`);
      
      // Delete current batch
      for (const blob of batch) {
        try {
          console.log(`  🗑️  Deleting: ${blob.pathname}`);
          await del(blob.url);
          deletedCount++;
          console.log(`  ✅ Deleted successfully`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Failed: ${error.message}`);
        }
      }

      // Wait before next batch (except for the last batch)
      if (i + BATCH_SIZE < blobs.length) {
        console.log(`\n⏳ Waiting ${DELAY_MS/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Deletion complete!`);
    console.log(`   Total blobs: ${blobs.length}`);
    console.log(`   Deleted: ${deletedCount}`);
    console.log(`   Failed: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteAllBlobs();
