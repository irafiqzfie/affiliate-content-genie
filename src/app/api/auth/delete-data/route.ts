import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Meta Platform Data Deletion Callback
 * 
 * This endpoint is required by Facebook Platform Terms.
 * It handles data deletion requests initiated by users through Facebook.
 * 
 * Register this URL in Facebook App Dashboard:
 * https://yourdomain.com/api/auth/delete-data
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signedRequest = body.signed_request;

    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      );
    }

    // Parse the signed request from Facebook
    const [encodedSig, payload] = signedRequest.split('.');
    
    // Verify signature (using Facebook App Secret)
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const sig = encodedSig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    if (sig !== expectedSig) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Decode the payload
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    const userId = data.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'No user_id in request' },
        { status: 400 }
      );
    }

    // Find the user by their Facebook ID (stored in accounts table)
    const account = await prisma.account.findFirst({
      where: {
        provider: 'facebook',
        providerAccountId: userId
      },
      include: {
        user: true
      }
    });

    if (!account) {
      // User not found - this is okay, return success
      console.log(`Data deletion requested for non-existent Facebook user: ${userId}`);
      return NextResponse.json({
        url: generateConfirmationUrl(userId),
        confirmation_code: generateConfirmationCode(userId)
      });
    }

    const userDbId = account.userId;

    if (!userDbId) {
      console.log(`Account found but no userId for Facebook user: ${userId}`);
      return NextResponse.json({
        url: generateConfirmationUrl(userId),
        confirmation_code: generateConfirmationCode(userId)
      });
    }

    // Delete user's data in order (respecting foreign key constraints)
    
    // 1. Delete scheduled posts
    await prisma.scheduledPost.deleteMany({
      where: { userId: userDbId }
    });

    // 2. Delete saved items
    await prisma.savedItem.deleteMany({
      where: { userId: userDbId }
    });

    // 3. Delete accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId: userDbId }
    });

    // 4. Delete the user
    await prisma.user.delete({
      where: { id: userDbId }
    });

    console.log(`Successfully deleted all data for user: ${userId} (DB ID: ${userDbId})`);

    // Return confirmation as required by Facebook
    return NextResponse.json({
      url: generateConfirmationUrl(userId),
      confirmation_code: generateConfirmationCode(userId)
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual data deletion requests
 * This allows users to request deletion directly from your app
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json(
      { error: 'user_id parameter required' },
      { status: 400 }
    );
  }

  // Return instructions
  return NextResponse.json({
    message: 'Data deletion request received',
    instructions: 'Your data will be deleted within 30 days as per our privacy policy.',
    support_email: 'admin@inabiz.online'
  });
}

// Helper functions
function generateConfirmationUrl(userId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  return `${baseUrl}/privacy?deletion_confirmed=true&user=${userId}`;
}

function generateConfirmationCode(userId: string): string {
  // Generate a unique confirmation code
  const timestamp = Date.now();
  return crypto
    .createHash('sha256')
    .update(`${userId}-${timestamp}`)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}
