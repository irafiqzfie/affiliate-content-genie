/**
 * POST /api/auth/threads/connect
 * 
 * Connects a Threads account to the current user's session
 * This is separate from the initial NextAuth login - it allows users
 * to link their Threads account for posting capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { storeOAuthTokens } from '@/lib/oauth-helpers';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in first.' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('❌ Threads OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/?error=threads_oauth_failed&message=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Missing code
  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for access token
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/threads/connect`;
    
    const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID || '',
        client_secret: process.env.THREADS_APP_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('❌ Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL(`/?error=threads_token_failed&message=${encodeURIComponent(tokenData.error_message || 'Token exchange failed')}`, request.url)
      );
    }

    // Get user info from Threads
    const userInfoResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${tokenData.access_token}`
    );

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || userInfo.error) {
      console.error('❌ Failed to get user info:', userInfo);
      return NextResponse.redirect(
        new URL(`/?error=threads_userinfo_failed`, request.url)
      );
    }

    // Store tokens in database
    console.log('💾 Storing Threads connection for user:', session.user.id);
    console.log('💾 Threads user ID:', userInfo.id);
    console.log('💾 Threads username:', userInfo.username);
    
    await storeOAuthTokens(
      session.user.id,
      'threads',
      userInfo.id,
      {
        accessToken: tokenData.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // 60 days
        threadsUserId: userInfo.id,
      }
    );

    console.log('✅ Threads account connected:', userInfo.username);

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL('/?success=threads_connected', request.url)
    );

  } catch (error) {
    console.error('❌ Error connecting Threads account:', error);
    return NextResponse.redirect(
      new URL(`/?error=threads_connection_failed`, request.url)
    );
  }
}

/**
 * POST /api/auth/threads/connect
 * 
 * Initiates the Threads OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Threads connect POST - Session:', session ? 'Found' : 'Not found');
    console.log('🔍 User ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.error('❌ No session or user ID found');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    if (!process.env.THREADS_APP_ID) {
      console.error('❌ THREADS_APP_ID not set');
      return NextResponse.json(
        { error: 'Server configuration error: THREADS_APP_ID not set' },
        { status: 500 }
      );
    }

    if (!process.env.NEXTAUTH_URL) {
      console.error('❌ NEXTAUTH_URL not set');
      return NextResponse.json(
        { error: 'Server configuration error: NEXTAUTH_URL not set' },
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/threads/connect`;
    
    const authUrl = new URL('https://threads.net/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.THREADS_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'threads_basic,threads_content_publish');
    authUrl.searchParams.set('response_type', 'code');

    console.log('✅ Threads auth URL generated:', authUrl.toString());
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('❌ Error in Threads connect POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
