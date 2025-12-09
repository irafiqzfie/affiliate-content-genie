/**
 * POST /api/post
 * 
 * Unified posting endpoint that handles:
 * - Threads posts
 * - Facebook Page posts
 * - Both simultaneously
 * 
 * Request body:
 * {
 *   platforms: ['threads', 'facebook'] | ['threads'] | ['facebook'],
 *   content: {
 *     text: string,
 *     imageUrl?: string,
 *     videoUrl?: string
 *   },
 *   facebookPageIds?: string[] // Required if posting to Facebook
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { 
  getOAuthTokens, 
  refreshThreadsToken, 
  refreshFacebookPageToken,
  generateAppSecretProof,
  isTokenExpired 
} from '@/lib/oauth-helpers';
import { prisma } from '@/lib/prisma';

interface PostContent {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface PostRequest {
  platforms: ('threads' | 'facebook')[];
  content: PostContent;
  facebookPageIds?: string[]; // Which Facebook Pages to post to
}

interface PostResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
  pageId?: string;
  pageName?: string;
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
    const body: PostRequest = await request.json();
    const { platforms, content, facebookPageIds } = body;

    // Validation
    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Please specify at least one platform' },
        { status: 400 }
      );
    }

    if (!content?.text) {
      return NextResponse.json(
        { error: 'Post text is required' },
        { status: 400 }
      );
    }

    const results: PostResult[] = [];

    // Post to Threads
    if (platforms.includes('threads')) {
      const threadsResult = await postToThreads(session.user.id, content);
      results.push(threadsResult);
    }

    // Post to Facebook Pages
    if (platforms.includes('facebook')) {
      if (!facebookPageIds || facebookPageIds.length === 0) {
        results.push({
          platform: 'facebook',
          success: false,
          error: 'No Facebook Pages selected. Please select at least one page.',
        });
      } else {
        for (const pageId of facebookPageIds) {
          const fbResult = await postToFacebookPage(session.user.id, pageId, content);
          results.push(fbResult);
        }
      }
    }

    // Determine overall success
    const allSuccessful = results.every(r => r.success);
    const someSuccessful = results.some(r => r.success);

    return NextResponse.json({
      success: allSuccessful,
      partial: someSuccessful && !allSuccessful,
      results,
    }, {
      status: allSuccessful ? 200 : (someSuccessful ? 207 : 400)
    });

  } catch (error) {
    console.error('❌ Post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Post to Threads
 */
async function postToThreads(userId: string, content: PostContent): Promise<PostResult> {
  try {
    // Get Threads account
    let account = await getOAuthTokens(userId, 'threads');

    if (!account) {
      return {
        platform: 'threads',
        success: false,
        error: 'Threads account not connected. Please connect your Threads account first.',
      };
    }

    // Check if token needs refresh
    if (account.expires_at && isTokenExpired(account.expires_at)) {
      console.log('🔄 Refreshing expired Threads token...');
      const newToken = await refreshThreadsToken(userId);
      
      if (!newToken) {
        return {
          platform: 'threads',
          success: false,
          error: 'Threads token expired and refresh failed. Please reconnect your account.',
        };
      }

      // Refetch account with new token
      account = await getOAuthTokens(userId, 'threads');
    }

    if (!account?.access_token || !account?.threadsUserId) {
      return {
        platform: 'threads',
        success: false,
        error: 'Invalid Threads account data. Please reconnect your account.',
      };
    }

    const accessToken = account.access_token;
    const threadsUserId = account.threadsUserId;

    // Step 1: Create container (works for both text and media posts)
    console.log(content.imageUrl || content.videoUrl ? '🖼️ Creating media container' : '📝 Creating text container');
    
    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      media_type: content.imageUrl ? 'IMAGE' : 'TEXT',
      text: content.text,
      access_token: account.access_token,
    });

    if (content.imageUrl) {
      containerParams.set('image_url', content.imageUrl);
    }

    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${account.threadsUserId}/threads`,
      {
        method: 'POST',
        body: containerParams,
      }
    );

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || containerData.error) {
      console.error('❌ Threads container creation failed:', containerData);
      return {
        platform: 'threads',
        success: false,
        error: containerData.error?.message || 'Failed to create Threads post',
      };
    }

    const creationId = containerData.id;
    console.log('✅ Container created:', creationId);

    // Step 1.5: Wait for container to be ready
    console.log('⏳ Waiting for Threads container to be ready...');
    
    // For text-only posts, shorter wait time (no media processing needed)
    const isTextOnly = !content.imageUrl && !content.videoUrl;
    const initialWait = isTextOnly ? 1000 : 2000; // 1s for text, 2s for media
    const maxAttempts = content.videoUrl ? 30 : (isTextOnly ? 10 : 20); // 10s text, 20s images, 30s videos
    
    await new Promise(resolve => setTimeout(resolve, initialWait));
    
    let statusAttempts = 0;
    let isReady = false;
    
    while (statusAttempts < maxAttempts && !isReady) {
      const statusUrl = `https://graph.threads.net/v1.0/${creationId}?fields=status,error_message&access_token=${accessToken}`;
      const statusResponse = await fetch(statusUrl);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`📊 Container status (${statusAttempts + 1}/${maxAttempts}):`, statusData.status);
        
        if (statusData.status === 'FINISHED') {
          isReady = true;
          console.log('✅ Container ready');
          break;
        } else if (statusData.status === 'ERROR') {
          console.error('❌ Container error:', statusData.error_message);
          return {
            platform: 'threads',
            success: false,
            error: statusData.error_message || 'Container processing failed',
          };
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      statusAttempts++;
    }
    
    if (!isReady) {
      return {
        platform: 'threads',
        success: false,
        error: `Container processing timeout after ${maxAttempts * 1.5}s`,
      };
    }

    // Additional wait before publishing
    console.log('⏳ Final wait before publishing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: account.access_token,
    });

    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${account.threadsUserId}/threads_publish`,
      {
        method: 'POST',
        body: publishParams,
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || publishData.error) {
      console.error('❌ Threads publish failed:', publishData);
      return {
        platform: 'threads',
        success: false,
        error: publishData.error?.message || 'Failed to publish Threads post',
      };
    }

    console.log('✅ Posted to Threads:', publishData.id);

    return {
      platform: 'threads',
      success: true,
      postId: publishData.id,
    };

  } catch (error) {
    console.error('❌ Threads post error:', error);
    return {
      platform: 'threads',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Post to Facebook Page
 */
async function postToFacebookPage(userId: string, pageId: string, content: PostContent): Promise<PostResult> {
  try {
    // Get Facebook Page account
    let account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'facebook-pages',
        pageId,
      },
    });

    if (!account) {
      return {
        platform: 'facebook',
        success: false,
        error: `Facebook Page not connected: ${pageId}`,
        pageId,
      };
    }

    // Check if token needs refresh
    if (account.expires_at && isTokenExpired(account.expires_at)) {
      console.log('🔄 Refreshing expired Facebook Page token...');
      const newToken = await refreshFacebookPageToken(userId, pageId);
      
      if (!newToken) {
        return {
          platform: 'facebook',
          success: false,
          error: 'Facebook token expired and refresh failed. Please reconnect your page.',
          pageId,
          pageName: account.pageName || undefined,
        };
      }

      // Refetch account with new token
      account = await prisma.account.findFirst({
        where: { userId, provider: 'facebook-pages', pageId },
      });
    }

    if (!account?.pageAccessToken) {
      return {
        platform: 'facebook',
        success: false,
        error: 'Invalid Facebook Page token. Please reconnect your page.',
        pageId,
        pageName: account.pageName || undefined,
      };
    }

    // Generate app secret proof for security
    const appsecret_proof = generateAppSecretProof(account.pageAccessToken);

    // Create Facebook post
    const postParams = new URLSearchParams({
      message: content.text,
      access_token: account.pageAccessToken,
      appsecret_proof,
    });

    // Add media if provided
    if (content.imageUrl) {
      postParams.set('url', content.imageUrl);
    }

    const endpoint = content.imageUrl 
      ? `https://graph.facebook.com/v18.0/${pageId}/photos`
      : `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const postResponse = await fetch(endpoint, {
      method: 'POST',
      body: postParams,
    });

    const postData = await postResponse.json();

    if (!postResponse.ok || postData.error) {
      console.error('❌ Facebook post failed:', postData);
      return {
        platform: 'facebook',
        success: false,
        error: postData.error?.message || 'Failed to create Facebook post',
        pageId,
        pageName: account.pageName || undefined,
      };
    }

    console.log('✅ Posted to Facebook Page:', account.pageName, postData.id);

    return {
      platform: 'facebook',
      success: true,
      postId: postData.id,
      pageId,
      pageName: account.pageName || undefined,
    };

  } catch (error) {
    console.error('❌ Facebook post error:', error);
    return {
      platform: 'facebook',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId,
    };
  }
}
