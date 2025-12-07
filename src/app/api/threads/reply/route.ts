import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { getOAuthTokens } from '@/lib/oauth-helpers';

/**
 * POST /api/threads/reply
 * 
 * Posts a reply/comment to an existing Threads post
 * Used for posting affiliate links as comments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch Threads connection from database
    const threadsAccount = await getOAuthTokens(session.user.id, 'threads');

    if (!threadsAccount?.access_token) {
      return NextResponse.json(
        { error: 'Please connect your Threads account first.' },
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

    const accessToken = threadsAccount.access_token;
    const threadsUserId = threadsAccount.threadsUserId || threadsAccount.providerAccountId;

    console.log('💬 Creating reply to post:', postId);

    // Step 1: Create a reply container
    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
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

    // Step 1.5: Wait for container to be ready
    console.log('⏳ Waiting for reply container to be ready...');
    
    let statusAttempts = 0;
    const maxAttempts = 10; // 10 seconds max for text replies
    let isReady = false;
    
    while (statusAttempts < maxAttempts && !isReady) {
      // Check container status
      const statusUrl = `https://graph.threads.net/v1.0/${containerId}?fields=status,error_message&access_token=${accessToken}`;
      const statusResponse = await fetch(statusUrl);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`📊 Reply container status (attempt ${statusAttempts + 1}):`, statusData.status);
        
        if (statusData.status === 'FINISHED') {
          isReady = true;
          break;
        } else if (statusData.status === 'ERROR') {
          return NextResponse.json(
            { 
              error: 'Reply container processing failed',
              details: statusData.error_message || 'Unknown error'
            },
            { status: 400 }
          );
        }
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      statusAttempts++;
    }
    
    if (!isReady) {
      return NextResponse.json(
        { 
          error: 'Reply container processing timeout',
          details: 'Container took too long to process. Please try again.'
        },
        { status: 408 }
      );
    }
    
    console.log('✅ Reply container ready for publishing');

    // Step 2: Publish the reply container
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
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
