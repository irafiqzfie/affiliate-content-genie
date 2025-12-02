import FacebookProvider from 'next-auth/providers/facebook'
import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Conditionally import PrismaAdapter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaAdapter: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const adapterModule = require('@next-auth/prisma-adapter');
  PrismaAdapter = adapterModule.PrismaAdapter;
} catch {
  console.warn('⚠️ PrismaAdapter not available - using JWT sessions only');
}

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is not set in environment variables');
}

if (!process.env.THREADS_APP_ID) {
  console.warn('⚠️ THREADS_APP_ID is not set - Threads login will not work');
}

if (!process.env.THREADS_APP_SECRET) {
  console.warn('⚠️ THREADS_APP_SECRET is not set - Threads login will not work');
}

export const authOptions: NextAuthOptions = {
  // Enable PrismaAdapter to store accounts in database
  ...(PrismaAdapter && prisma ? { adapter: PrismaAdapter(prisma) } : {}),
  debug: true, // Enable debug mode to see errors
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
    }),
    // Threads OAuth provider (uses Meta's OAuth similar to Instagram)
    {
      id: 'threads',
      name: 'Threads',
      type: 'oauth',
      authorization: {
        url: 'https://threads.net/oauth/authorize',
        params: {
          scope: 'threads_basic,threads_content_publish',
          response_type: 'code',
          client_id: process.env.THREADS_APP_ID || ''
        }
      },
      token: {
        url: 'https://graph.threads.net/oauth/access_token',
        async request(context) {
          // Extract from context.provider and context.params
          const client_id = context.provider.clientId;
          const client_secret = context.provider.clientSecret;
          const code = context.params.code;
          const redirect_uri = context.provider.callbackUrl;
          
          console.log('🔄 Attempting token exchange with:', {
            client_id,
            redirect_uri,
            code: code ? 'present' : 'missing'
          });
          
          // Threads API expects form-urlencoded POST
          const response = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: client_id as string,
              client_secret: client_secret as string,
              grant_type: 'authorization_code',
              redirect_uri: redirect_uri as string,
              code: code as string,
            }),
          });

          const tokens = await response.json();
          
          if (!response.ok) {
            console.error('❌ Threads token error:', JSON.stringify(tokens, null, 2));
            throw new Error(tokens.error?.message || tokens.error_message || 'Failed to get access token');
          }

          console.log('✅ Token exchange successful');
          return { tokens };
        },
      },
      userinfo: {
        url: 'https://graph.threads.net/v1.0/me',
        async request(context) {
          const response = await fetch(
            `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${context.tokens.access_token}`
          );
          
          return await response.json();
        },
      },
      clientId: process.env.THREADS_APP_ID || '',
      clientSecret: process.env.THREADS_APP_SECRET || '',
      profile(profile) {
        console.log('📱 Threads profile:', profile);
        return {
          id: profile.id,
          name: profile.name || profile.username,
          email: `${profile.username}@threads.net`, // Generate fake email since Threads doesn't provide one
          image: profile.threads_profile_picture_url
        }
      }
    }
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: PrismaAdapter && prisma ? 'database' : 'jwt',
    maxAge: 60 * 24 * 60 * 60, // 60 days
  },
  pages: {
    signIn: '/',
    error: '/', // Redirect to home on error
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in - save access token and expiry to JWT
      if (account && user) {
        console.log('💾 Storing tokens for', account.provider);
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 24 * 60 * 60 * 1000, // Default 60 days
          provider: account.provider,
          userId: user.id,
        };
      }

      // Token is still valid
      if (Date.now() < (token.expiresAt as number)) {
        console.log('✅ Token still valid');
        return token;
      }

      // Token expired - try to refresh for Threads
      if (token.provider === 'threads' && token.refreshToken) {
        console.log('🔄 Refreshing Threads token...');
        try {
          const params = new URLSearchParams({
            grant_type: 'th_refresh_token',
            access_token: token.refreshToken as string,
          });

          const response = await fetch(`https://graph.threads.net/oauth/access_token?${params.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          const refreshedTokens = await response.json();

          if (!response.ok) throw refreshedTokens;

          console.log('✅ Token refreshed successfully');
          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
          };
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          // Return token as-is, will force re-login on next request
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }

      // For long-lived tokens without refresh, just extend expiry
      console.log('⚠️ Token expired but no refresh available, extending...');
      return {
        ...token,
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // Extend by 60 days
      };
    },
    async session({ session, token }) {
      // Make access token and provider available in session
      if (token) {
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
        session.user.id = token.userId as string;
        // Add error to session if present (for handling expired tokens)
        if (token.error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session as any).error = token.error;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('✅ Sign in callback:', { 
        user: user?.id, 
        provider: account?.provider,
        profile: profile 
      });
      
      // If signing in with Threads, ensure threadsUserId is stored
      if (account?.provider === 'threads' && profile && user?.id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const threadsProfile = profile as any;
          const threadsUserId = threadsProfile.id || threadsProfile.username;
          
          // Update the account record to include threadsUserId
          await prisma.account.updateMany({
            where: {
              userId: user.id,
              provider: 'threads',
            },
            data: {
              threadsUserId: threadsUserId,
            },
          });
          console.log('✅ Updated Threads account with threadsUserId:', threadsUserId);
        } catch (error) {
          console.error('❌ Failed to update threadsUserId:', error);
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home after sign in
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account }) {
      console.log('🔐 User signed in:', user?.email || user?.name, 'via', account?.provider);
    },
    async signOut({ session }) {
      console.log('👋 User signed out');
    }
  }
}
