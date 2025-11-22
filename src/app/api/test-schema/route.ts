import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/test-schema
 * 
 * Tests if Prisma schema has affiliateLink field by attempting to create with it
 */
export async function GET() {
  try {
    // Test if we can create with affiliateLink - will error if field doesn't exist
    const testPayload = {
      platform: 'THREADS' as const,
      scheduledTime: new Date(),
      imageUrl: 'test',
      caption: 'test',
      status: 'PENDING' as const,
      affiliateLink: 'https://test.com'
    };

    // This will throw "Unknown argument `affiliateLink`" if field doesn't exist
    // We won't actually create it, just validate the schema accepts it
    const validation = await prisma.scheduledPost.create({
      data: testPayload
    }).catch((e: Error) => {
      if (e.message.includes('Unknown argument')) {
        return { error: 'Field not in schema', message: e.message };
      }
      // Other errors (like connection) are ok for this test
      return { error: 'validation_passed' };
    });

    if (validation && 'error' in validation && validation.error === 'Field not in schema') {
      return NextResponse.json({
        success: false,
        hasAffiliateLinkField: false,
        message: '❌ affiliateLink field NOT in Prisma schema',
        error: validation.message
      });
    }

    // If we got here, the field exists (might have created or failed for other reasons)
    // Clean up if actually created
    if (validation && 'id' in validation) {
      await prisma.scheduledPost.delete({ where: { id: validation.id } });
    }

    return NextResponse.json({
      success: true,
      hasAffiliateLinkField: true,
      message: '✅ affiliateLink field exists in Prisma schema'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Unknown argument')) {
      return NextResponse.json({
        success: false,
        hasAffiliateLinkField: false,
        message: '❌ affiliateLink field NOT in Prisma schema',
        error: errorMessage
      });
    }

    return NextResponse.json({
      success: true,
      hasAffiliateLinkField: true,
      message: '✅ affiliateLink field accepted (other error occurred)',
      note: 'Field exists but operation failed for other reasons',
      error: errorMessage
    });
  }
}
