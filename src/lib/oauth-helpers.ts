/**
 * OAuth Helper Functions
 * 
 * Utilities for managing multi-provider OAuth tokens and connections
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  pageId?: string;
  pageName?: string;
  pageAccessToken?: string;
  threadsUserId?: string;
  instagramId?: string;
}

/**
 * Store OAuth tokens for a provider in the Account table
 */
export async function storeOAuthTokens(
  userId: string,
  provider: 'threads' | 'facebook' | 'facebook-pages',
  providerAccountId: string,
  tokenData: TokenData
) {
  const { accessToken, refreshToken, expiresAt, pageId, pageName, pageAccessToken, threadsUserId, instagramId } = tokenData;

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: expiresAt || null,
      pageId: pageId || null,
      pageName: pageName || null,
      pageAccessToken: pageAccessToken || null,
      threadsUserId: threadsUserId || null,
      instagramId: instagramId || null,
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider,
      providerAccountId,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: expiresAt || null,
      token_type: 'Bearer',
      scope: provider === 'threads' ? 'threads_basic,threads_content_publish' : 'pages_show_list,pages_read_engagement,pages_manage_posts',
      pageId: pageId || null,
      pageName: pageName || null,
      pageAccessToken: pageAccessToken || null,
      threadsUserId: threadsUserId || null,
      instagramId: instagramId || null,
    },
  });
}

/**
 * Get OAuth tokens for a specific provider
 */
export async function getOAuthTokens(userId: string, provider: 'threads' | 'facebook' | 'facebook-pages') {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
    orderBy: {
      updatedAt: 'desc', // Get most recent connection
    },
  });

  return account;
}

/**
 * Get all connected accounts for a user
 */
export async function getUserConnections(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      pageId: true,
      pageName: true,
      threadsUserId: true,
      expires_at: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    threads: accounts.find((a: { provider: string }) => a.provider === 'threads') || null,
    facebook: accounts.filter((a: { provider: string }) => a.provider === 'facebook-pages'),
  };
}

/**
 * Refresh Threads long-lived token
 * Threads tokens last 60 days and can be refreshed
 */
export async function refreshThreadsToken(userId: string): Promise<string | null> {
  const account = await getOAuthTokens(userId, 'threads');
  
  if (!account?.access_token) {
    console.error('❌ No Threads account found for user:', userId);
    return null;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'th_refresh_token',
      access_token: account.access_token,
    });

    const response = await fetch(`https://graph.threads.net/oauth/access_token?${params.toString()}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Threads token refresh failed:', data);
      return null;
    }

    // Store the new token
    await storeOAuthTokens(userId, 'threads', account.providerAccountId, {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // 60 days
      threadsUserId: account.threadsUserId || account.providerAccountId,
    });

    console.log('✅ Threads token refreshed for user:', userId);
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Threads token:', error);
    return null;
  }
}

/**
 * Refresh Facebook Page token
 * Page tokens last 60 days and can be extended
 */
export async function refreshFacebookPageToken(userId: string, pageId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'facebook-pages',
      pageId,
    },
  });

  if (!account?.pageAccessToken) {
    console.error('❌ No Facebook Page account found:', { userId, pageId });
    return null;
  }

  try {
    // Exchange short-lived page token for long-lived one
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
      fb_exchange_token: account.pageAccessToken,
    });

    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('❌ Facebook token refresh failed:', data);
      return null;
    }

    // Update the page token
    await prisma.account.update({
      where: { id: account.id },
      data: {
        pageAccessToken: data.access_token,
        expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Facebook Page token refreshed:', pageId);
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Facebook Page token:', error);
    return null;
  }
}

/**
 * Generate app secret proof for Facebook API calls (security requirement)
 */
export function generateAppSecretProof(accessToken: string): string {
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
  return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
}

/**
 * Check if a token is expired or about to expire (within 24 hours)
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const bufferTime = 24 * 60 * 60; // 24 hours buffer
  
  return expiresAt < (now + bufferTime);
}

/**
 * Disconnect a provider for a user
 */
export async function disconnectProvider(userId: string, provider: string, accountId?: string) {
  if (accountId) {
    // Disconnect specific account (e.g., specific Facebook Page)
    await prisma.account.delete({
      where: {
        id: accountId,
        userId, // Ensure user owns this account
      },
    });
  } else {
    // Disconnect all accounts for this provider
    await prisma.account.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }
}
