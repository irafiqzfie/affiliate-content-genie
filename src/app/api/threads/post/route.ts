import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { getOAuthTokens } from '@/lib/oauth-helpers';

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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch Threads connection from database
    const threadsAccount = await getOAuthTokens(session.user.id, 'threads');
    
    console.log('🔍 Threads account check:', {
      hasAccount: !!threadsAccount,
      hasAccessToken: !!threadsAccount?.access_token,
      threadsUserId: threadsAccount?.threadsUserId,
      userId: session.user.id
    });

    if (!threadsAccount?.access_token) {
      console.error('❌ No Threads connection found. User needs to connect Threads account.');
      return NextResponse.json(
        { error: 'Please connect your Threads account first.' },
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

    // Validate mediaUrl if provided
    if (mediaUrl) {
      try {
        const url = new URL(mediaUrl);
        if (!url.protocol.startsWith('http')) {
          return NextResponse.json(
            { error: 'Image URL must be a valid HTTP or HTTPS URL. Data URLs and relative paths are not supported by Threads API.' },
            { status: 400 }
          );
        }
        
        // Verify the image is actually accessible before posting
        console.log('📸 Verifying image accessibility:', mediaUrl);
        const imageCheckResponse = await fetch(mediaUrl, { method: 'HEAD' });
        if (!imageCheckResponse.ok) {
          console.error('❌ Image not accessible:', imageCheckResponse.status, imageCheckResponse.statusText);
          return NextResponse.json(
            { 
              error: 'Image URL is not publicly accessible',
              details: `Threads API requires images to be publicly accessible. The URL returned status ${imageCheckResponse.status}. Please ensure your image storage (Vercel Blob) is configured with public access.`
            },
            { status: 400 }
          );
        }
        console.log('✅ Image is publicly accessible');
      } catch (error) {
        console.error('❌ Image validation error:', error);
        return NextResponse.json(
          { 
            error: `Invalid or inaccessible image URL`,
            details: error instanceof Error ? error.message : 'Could not access the provided image URL. Ensure it is publicly accessible.'
          },
          { status: 400 }
        );
      }
      console.log('📸 Media URL validated:', mediaUrl);
    }

    // Use access token and user ID from Threads account
    const accessToken = threadsAccount.access_token;
    const threadsUserId = threadsAccount.threadsUserId || threadsAccount.providerAccountId;

    console.log('📤 Posting to Threads:', { threadsUserId, hasToken: !!accessToken, hasMedia: !!mediaUrl });

    // Step 1: Create a container (media post preparation)
    const containerUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    
    const containerParams: Record<string, string> = {
      media_type: mediaUrl ? mediaType : 'TEXT',
      text: text,
      access_token: accessToken
    };

    // Only add image/video URL if provided
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
      
      // Check if it's an expired token error
      if (errorData.error?.code === 190 || errorData.error?.message?.includes('expired')) {
        return NextResponse.json(
          { 
            error: 'Your Threads session has expired. Please sign out and sign back in to reconnect your account.',
            details: errorData 
          },
          { status: 401 }
        );
      }
      
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

    console.log('✅ Container created:', creationId);

    // Step 1.5: Wait for container to be ready
    console.log('⏳ Waiting for container to be ready...');
    
    let statusAttempts = 0;
    const maxAttempts = mediaUrl ? (mediaType === 'VIDEO' ? 30 : 15) : 5; // 15s for images (increased from 10), 30s for video, 5s for text
    let isReady = false;
    let lastError: string | null = null;
    
    while (statusAttempts < maxAttempts && !isReady) {
      // Check container status
      const statusUrl = `https://graph.threads.net/v1.0/${creationId}?fields=status,error_message&access_token=${accessToken}`;
      const statusResponse = await fetch(statusUrl);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`📊 Container status (attempt ${statusAttempts + 1}/${maxAttempts}):`, statusData);
        
        if (statusData.status === 'FINISHED') {
          isReady = true;
          console.log('✅ Container processing complete');
          break;
        } else if (statusData.status === 'ERROR') {
          lastError = statusData.error_message || 'Unknown processing error';
          console.error('❌ Container processing error:', lastError);
          return NextResponse.json(
            { 
              error: 'Threads media processing failed',
              details: `${lastError}. ${mediaUrl ? 'Ensure the image URL is publicly accessible and the image format is supported (JPEG, PNG).' : ''}`
            },
            { status: 400 }
          );
        } else if (statusData.status === 'IN_PROGRESS') {
          console.log('⏳ Still processing...');
        }
      } else {
        console.warn(`⚠️ Failed to check status (attempt ${statusAttempts + 1})`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      statusAttempts++;
    }
    
    if (!isReady) {
      return NextResponse.json(
        { 
          error: 'Threads processing timeout',
          details: `Container took longer than ${maxAttempts} seconds to process. ${mediaUrl ? 'This may indicate the image URL is not accessible or the image format is incompatible. Threads requires JPEG or PNG images.' : 'Please try again.'}`
        },
        { status: 408 }
      );
    }
    
    console.log('✅ Container ready for publishing');

    // Step 2: Publish the container
    const publishUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`;
    
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
      
      // Check for specific error codes
      if (errorData.error?.code === 24 && errorData.error?.error_subcode === 4279009) {
        return NextResponse.json(
          { 
            error: 'Media not found',
            details: 'Threads could not find or access the image. This usually means: (1) The image URL is not publicly accessible, (2) The image was deleted/expired, or (3) Vercel Blob storage is not properly configured with public access. Please check your BLOB_READ_WRITE_TOKEN environment variable and ensure blob storage has public access enabled.'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to publish Threads post',
          details: errorData 
        },
        { status: publishResponse.status }
      );
    }

    const publishData = await publishResponse.json();

    console.log('✅ Published to Threads:', publishData.id);

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

    const isConnected = !!session?.accessToken && session?.provider === 'threads';

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        message: 'Threads account not connected'
      });
    }

    const accessToken = session.accessToken;

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
