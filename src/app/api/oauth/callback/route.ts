import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Provider = 'facebook' | 'threads';

async function exchangeFacebookCode(code: string, redirectUri: string) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const tokenUrl = `https://graph.facebook.com/v17.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
  const res = await fetch(tokenUrl);
  if (!res.ok) throw new Error('Failed to exchange code');
  return res.json();
}

async function fetchFacebookProfile(accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, code, redirectUri } = body as { provider: Provider; code: string; redirectUri?: string };

    if (!provider || !code) return NextResponse.json({ message: 'Missing provider or code' }, { status: 400 });

    if (provider === 'facebook') {
      if (!redirectUri) return NextResponse.json({ message: 'Missing redirectUri for Facebook' }, { status: 400 });
      const tokenData = await exchangeFacebookCode(code, redirectUri);
      const accessToken = tokenData.access_token as string;
      const profile = await fetchFacebookProfile(accessToken);

      // Upsert account
      const account = await prisma.account.upsert({
        where: { provider_providerAccountId: { provider: 'facebook', providerAccountId: profile.id } },
        update: {
          access_token: accessToken,
          refresh_token: tokenData.refresh_token || null
        },
        create: {
          provider: 'facebook',
          providerAccountId: profile.id,
          access_token: accessToken,
          refresh_token: tokenData.refresh_token || null
        }
      });

      return NextResponse.json({ account, profile });
    }

    if (provider === 'threads') {
      // Threads API integration requires app-level setup. Placeholder.
      return NextResponse.json({ message: 'Threads OAuth callback placeholder' });
    }

    return NextResponse.json({ message: 'Unsupported provider' }, { status: 400 });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ message: 'OAuth callback failed' }, { status: 500 });
  }
}
