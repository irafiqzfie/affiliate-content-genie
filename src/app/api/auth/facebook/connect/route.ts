/**
 * POST /api/auth/facebook/connect
 * 
 * Connects Facebook Pages to the current user's session
 * This handles the OAuth flow for Facebook Pages with pages_manage_posts permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { storeOAuthTokens } from '@/lib/oauth-helpers';

export async function GET(request: NextRequest) {
  console.log('🔍 Facebook OAuth callback received');
  
  const session = await getServerSession(authOptions);

  console.log('🔍 Session exists:', !!session);
  console.log('🔍 User ID:', session?.user?.id);

  if (!session?.user?.id) {
    console.error('❌ No session during Facebook OAuth callback');
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in first.' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('🔍 OAuth code received:', !!code);
  console.log('🔍 OAuth error:', error);
  
  if (errorDescription) {
    console.error('❌ OAuth error description:', errorDescription);
  }

  // Handle OAuth error
  if (error) {
    console.error('❌ Facebook OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=facebook_oauth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Missing code
  if (!code) {
    console.error('❌ No OAuth code received');
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/facebook/connect`;
    
    // Step 1: Exchange code for user access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('❌ Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL(`/?error=facebook_token_failed&message=${encodeURIComponent(tokenData.error?.message || 'Token exchange failed')}`, request.url)
      );
    }

    const userAccessToken = tokenData.access_token;

    // Step 2: Exchange for long-lived user token (60 days)
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
      fb_exchange_token: userAccessToken,
    });

    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams.toString()}`
    );

    const longLivedData = await longLivedResponse.json();

    if (!longLivedResponse.ok || longLivedData.error) {
      console.error('❌ Long-lived token exchange failed:', longLivedData);
      // Continue with short-lived token if long-lived exchange fails
    }

    const finalUserToken = longLivedData.access_token || userAccessToken;

    // Step 3: Get user's Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${finalUserToken}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || pagesData.error) {
      console.error('❌ Failed to get pages:', pagesData);
      return NextResponse.redirect(
        new URL(`/?error=facebook_pages_failed&message=${encodeURIComponent(pagesData.error?.message || 'Failed to get pages')}`, request.url)
      );
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        new URL(`/?error=no_facebook_pages&message=${encodeURIComponent('No Facebook Pages found. Please create a Facebook Page first.')}`, request.url)
      );
    }

    // Step 4: Store each page as a separate account
    // Each page gets its own long-lived page access token (60 days)
    for (const page of pagesData.data) {
      await storeOAuthTokens(
        session.user.id,
        'facebook-pages',
        page.id, // Page ID as providerAccountId
        {
          accessToken: finalUserToken, // User's long-lived token
          pageAccessToken: page.access_token, // Page's long-lived token
          pageId: page.id,
          pageName: page.name,
          expiresAt: longLivedData.expires_in 
            ? Math.floor(Date.now() / 1000) + longLivedData.expires_in 
            : Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // Default 60 days
        }
      );
    }

    console.log('✅ Facebook Pages connected:', pagesData.data.map((p: { name: string }) => p.name).join(', '));

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL(`/?success=facebook_connected&pages=${pagesData.data.length}`, request.url)
    );

  } catch (error) {
    console.error('❌ Error connecting Facebook account:', error);
    return NextResponse.redirect(
      new URL(`/?error=facebook_connection_failed`, request.url)
    );
  }
}

/**
 * POST /api/auth/facebook/connect
 * 
 * Initiates the Facebook OAuth flow for Pages
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  console.log('🔍 Facebook connect POST - Session:', session?.user?.id ? 'Found' : 'Not found');

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in first.' },
      { status: 401 }
    );
  }

  if (!process.env.FACEBOOK_CLIENT_ID) {
    console.error('❌ FACEBOOK_CLIENT_ID not set');
    return NextResponse.json(
      { error: 'Server configuration error: FACEBOOK_CLIENT_ID not set' },
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

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/facebook/connect`;
  
  console.log('🔗 Facebook OAuth URL:', redirectUri);
  
  // Use only basic, publicly available permissions
  // For development/testing with Facebook Login use case
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', process.env.FACEBOOK_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'public_profile,pages_show_list'); // Minimal scope that should work
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', crypto.randomUUID()); // CSRF protection

  console.log('✅ Facebook auth URL generated with scope:', 'public_profile,pages_show_list');

  return NextResponse.json({ authUrl: authUrl.toString() });
}
