import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/test-schema
 * 
 * Tests if Prisma schema has affiliateLink field
 */
export async function GET() {
  try {
    // Try to get the Prisma model fields
    const modelFields = Object.keys((prisma as any).scheduledPost.fields || {});
    
    // Check if affiliateLink is in the schema
    const hasAffiliateLink = 'affiliateLink' in ((prisma as any).scheduledPost.fields || {});
    
    return NextResponse.json({
      success: true,
      hasAffiliateLinkField: hasAffiliateLink,
      message: hasAffiliateLink 
        ? '✅ affiliateLink field exists in Prisma schema' 
        : '❌ affiliateLink field NOT found in Prisma schema',
      allFields: modelFields,
      prismaVersion: require('@prisma/client/package.json').version
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not inspect Prisma schema'
    }, { status: 500 });
  }
}
