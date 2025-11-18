import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/threads/post
 * 
 * Posts content to Threads using the Threads API
 * 
 * Request body:
 * - text: string (the caption/text content)
 * - mediaUrl?: string (optional image URL)
 * - mediaType?: 'IMAGE' | 'VIDEO' (default: IMAGE)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, mediaUrl, mediaType = 'IMAGE' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Get user's Threads access token from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: 'threads' }
        }
      }
    });

    if (!user?.accounts?.[0]?.access_token) {
      return NextResponse.json(
        { error: 'Threads account not connected. Please connect your Threads account first.' },
        { status: 403 }
      );
    }

    const accessToken = user.accounts[0].access_token;
    const userId = user.accounts[0].providerAccountId;

    // Step 1: Create a container (media post preparation)
    const containerUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    
    const containerParams: Record<string, string> = {
      media_type: mediaType,
      text: text,
      access_token: accessToken
    };

    if (mediaUrl) {
      if (mediaType === 'IMAGE') {
        containerParams.image_url = mediaUrl;
      } else if (mediaType === 'VIDEO') {
        containerParams.video_url = mediaUrl;
      }
    }

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(containerParams)
    });

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json();
      console.error('Threads container creation failed:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to create Threads post container',
          details: errorData 
        },
        { status: containerResponse.status }
      );
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    // Step 2: Publish the container
    const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish`;
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json();
      console.error('Threads publish failed:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to publish Threads post',
          details: errorData 
        },
        { status: publishResponse.status }
      );
    }

    const publishData = await publishResponse.json();

    return NextResponse.json({
      success: true,
      postId: publishData.id,
      message: 'Successfully posted to Threads!'
    });

  } catch (error) {
    console.error('Threads post error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/threads/post
 * 
 * Get user's Threads profile information and connection status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: 'threads' }
        }
      }
    });

    const isConnected = !!user?.accounts?.[0]?.access_token;

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        message: 'Threads account not connected'
      });
    }

    const accessToken = user.accounts[0].access_token;

    // Fetch Threads profile info
    const profileResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
    );

    if (!profileResponse.ok) {
      return NextResponse.json({
        connected: true,
        error: 'Failed to fetch profile info'
      });
    }

    const profileData = await profileResponse.json();

    return NextResponse.json({
      connected: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Threads profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
