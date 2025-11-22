import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

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
    
    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasEmail: !!session?.user?.email,
      hasAccessToken: !!session?.accessToken,
      provider: session?.provider,
      userId: session?.user?.id
    });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in with Threads.' },
        { status: 401 }
      );
    }

    if (!session?.accessToken) {
      console.error('❌ No access token in session. User needs to sign out and sign back in.');
      return NextResponse.json(
        { error: 'Session expired. Please sign out and sign back in with Threads to refresh your credentials.' },
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
      } catch {
        return NextResponse.json(
          { error: `Invalid image URL format: ${mediaUrl}. Must be a publicly accessible HTTP/HTTPS URL.` },
          { status: 400 }
        );
      }
      console.log('📸 Media URL:', mediaUrl);
    }

    // Get access token from session (JWT-only, no database)
    const accessToken = session.accessToken;
    const userId = session.user.id;

    console.log('📤 Posting to Threads:', { userId, hasToken: !!accessToken, hasMedia: !!mediaUrl });

    // Step 1: Create a container (media post preparation)
    const containerUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    
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

    // Step 1.5: Wait for container to be ready (for both images and videos)
    if (mediaUrl) {
      console.log('⏳ Waiting for media container to be ready...');
      
      let statusAttempts = 0;
      const maxAttempts = mediaType === 'VIDEO' ? 30 : 10; // 30s for video, 10s for images
      let isReady = false;
      
      while (statusAttempts < maxAttempts && !isReady) {
        // Check container status
        const statusUrl = `https://graph.threads.net/v1.0/${creationId}?fields=status,error_message&access_token=${accessToken}`;
        const statusResponse = await fetch(statusUrl);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 Container status (attempt ${statusAttempts + 1}):`, statusData.status);
          
          if (statusData.status === 'FINISHED') {
            isReady = true;
            break;
          } else if (statusData.status === 'ERROR') {
            return NextResponse.json(
              { 
                error: 'Media processing failed',
                details: statusData.error_message || 'Unknown error during media processing'
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
            error: 'Media processing timeout',
            details: `Media took too long to process. Please try again.`
          },
          { status: 408 }
        );
      }
      
      console.log('✅ Media container ready for publishing');
    }

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
