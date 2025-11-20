import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import type { Session, NextAuthOptions } from 'next-auth';

/**
 * POST /api/threads/reply
 * 
 * Posts a reply/comment to an existing Threads post
 * Used for posting affiliate links as comments
 */
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null;

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Threads' },
        { status: 401 }
      );
    }

    const { postId, text } = await request.json();

    if (!postId || !text) {
      return NextResponse.json(
        { error: 'postId and text are required' },
        { status: 400 }
      );
    }

    const accessToken = session.accessToken;
    const userId = session.user?.id;

    console.log('💬 Creating reply to post:', postId);

    // Step 1: Create a reply container
    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: text,
          reply_to_id: postId,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      console.error('❌ Failed to create reply container:', containerData);
      return NextResponse.json(
        {
          error: 'Failed to create reply container',
          details: containerData,
        },
        { status: containerResponse.status }
      );
    }

    const containerId = containerData.id;
    console.log('📦 Reply container created:', containerId);

    // Step 2: Publish the reply container
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error('❌ Failed to publish reply:', publishData);
      return NextResponse.json(
        {
          error: 'Failed to publish reply',
          details: publishData,
        },
        { status: publishResponse.status }
      );
    }

    console.log('✅ Reply posted successfully:', publishData.id);

    return NextResponse.json({
      success: true,
      replyId: publishData.id,
      message: 'Reply posted successfully',
    });
  } catch (error) {
    console.error('❌ Error posting reply:', error);
    return NextResponse.json(
      {
        error: 'Failed to post reply',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
