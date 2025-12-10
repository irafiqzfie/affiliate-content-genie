/**
 * POST /api/comment
 * 
 * Posts a comment to an existing post on Threads or Facebook
 * Used for posting affiliate links as comments
 * 
 * Request body:
 * {
 *   platform: 'threads' | 'facebook',
 *   postId: string,
 *   text: string,
 *   pageId?: string // Required for Facebook
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { getOAuthTokens, generateAppSecretProof } from '@/lib/oauth-helpers';
import { prisma } from '@/lib/prisma';

interface CommentRequest {
  platform: 'threads' | 'facebook';
  postId: string;
  text: string;
  pageId?: string; // For Facebook
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in first.' },
      { status: 401 }
    );
  }

  try {
    const body: CommentRequest = await request.json();
    const { platform, postId, text, pageId } = body;

    if (!platform || !postId || !text) {
      return NextResponse.json(
        { error: 'platform, postId, and text are required' },
        { status: 400 }
      );
    }

    if (platform === 'threads') {
      return await postThreadsComment(session.user.id, postId, text);
    } else if (platform === 'facebook') {
      if (!pageId) {
        return NextResponse.json(
          { error: 'pageId is required for Facebook comments' },
          { status: 400 }
        );
      }
      return await postFacebookComment(session.user.id, pageId, postId, text);
    } else {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "threads" or "facebook"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Comment posting error:', error);
    return NextResponse.json(
      { error: 'Failed to post comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Post a comment on Threads
 */
async function postThreadsComment(userId: string, postId: string, text: string) {
  const account = await getOAuthTokens(userId, 'threads');

  if (!account?.access_token) {
    return NextResponse.json(
      { error: 'Threads account not connected. Please connect your Threads account first.' },
      { status: 401 }
    );
  }

  const accessToken = account.access_token;
  const threadsUserId = account.threadsUserId || account.providerAccountId;

  console.log('💬 Creating Threads reply to post:', postId);

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

  if (!containerResponse.ok || containerData.error) {
    console.error('❌ Failed to create Threads reply container:', containerData);
    
    // Check if it's a permissions error (can only reply to own posts)
    if (containerData.error?.code === 10) {
      return NextResponse.json(
        {
          error: 'Cannot reply to this post',
          details: 'Threads API only allows replying to your own posts. The affiliate link comment feature only works on posts created by this account.',
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create Threads reply',
        details: containerData.error?.message || 'Unknown error',
      },
      { status: containerResponse.status }
    );
  }

  const containerId = containerData.id;
  console.log('📦 Threads reply container created:', containerId);

  // Step 1.5: Wait for container to be ready
  console.log('⏳ Waiting for reply container to be ready...');
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1s initial wait
  
  let statusAttempts = 0;
  const maxAttempts = 10;
  let isReady = false;
  
  while (statusAttempts < maxAttempts && !isReady) {
    const statusUrl = `https://graph.threads.net/v1.0/${containerId}?fields=status,error_message&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`📊 Reply status (${statusAttempts + 1}/${maxAttempts}):`, statusData.status);
      
      if (statusData.status === 'FINISHED') {
        isReady = true;
        break;
      } else if (statusData.status === 'ERROR') {
        return NextResponse.json(
          { error: 'Reply processing failed', details: statusData.error_message },
          { status: 400 }
        );
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    statusAttempts++;
  }
  
  if (!isReady) {
    return NextResponse.json(
      { error: 'Reply processing timeout' },
      { status: 408 }
    );
  }

  // Step 2: Publish the reply
  await new Promise(resolve => setTimeout(resolve, 500));

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

  if (!publishResponse.ok || publishData.error) {
    console.error('❌ Failed to publish Threads reply:', publishData);
    return NextResponse.json(
      {
        error: 'Failed to publish Threads reply',
        details: publishData.error?.message || 'Unknown error',
      },
      { status: publishResponse.status }
    );
  }

  console.log('✅ Threads reply published:', publishData.id);

  return NextResponse.json({
    success: true,
    platform: 'threads',
    commentId: publishData.id,
  });
}

/**
 * Post a comment on Facebook
 */
async function postFacebookComment(userId: string, pageId: string, postId: string, text: string) {
  // Get Facebook page account
  const pageAccount = await prisma.account.findFirst({
    where: {
      userId: userId,
      provider: 'facebook-pages',
      pageId: pageId,
    },
  });

  if (!pageAccount?.pageAccessToken) {
    return NextResponse.json(
      { error: 'Facebook page not connected or token missing' },
      { status: 401 }
    );
  }

  const pageAccessToken = pageAccount.pageAccessToken;

  console.log('💬 Creating Facebook comment on post:', postId);

  // Facebook comment API: POST /{post-id}/comments
  const commentResponse = await fetch(
    `https://graph.facebook.com/v20.0/${postId}/comments`,
    {
      method: 'POST',
      body: new URLSearchParams({
        message: text,
        access_token: pageAccessToken,
      }),
    }
  );

  const commentData = await commentResponse.json();

  if (!commentResponse.ok || commentData.error) {
    console.error('❌ Failed to create Facebook comment:', commentData);
    return NextResponse.json(
      {
        error: 'Failed to create Facebook comment',
        details: commentData.error?.message || 'Unknown error',
      },
      { status: commentResponse.status }
    );
  }

  console.log('✅ Facebook comment posted:', commentData.id);

  return NextResponse.json({
    success: true,
    platform: 'facebook',
    commentId: commentData.id,
  });
}
