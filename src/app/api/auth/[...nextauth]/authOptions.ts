import FacebookProvider from 'next-auth/providers/facebook'
import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Conditionally import PrismaAdapter
let PrismaAdapter: any = null;
try {
  const adapterModule = require('@next-auth/prisma-adapter');
  PrismaAdapter = adapterModule.PrismaAdapter;
} catch (error) {
  console.warn('⚠️ PrismaAdapter not available - using JWT sessions only');
}

export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter if available, otherwise rely on JWT
  ...(PrismaAdapter && prisma ? { adapter: PrismaAdapter(prisma) } : {}),
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
          response_type: 'code'
        }
      },
      token: 'https://graph.threads.net/oauth/access_token',
      userinfo: 'https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url',
      clientId: process.env.THREADS_APP_ID || '',
      clientSecret: process.env.THREADS_APP_SECRET || '',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name || profile.username,
          email: null, // Threads doesn't provide email
          image: profile.threads_profile_picture_url
        }
      }
    }
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: NextAuthUser }) {
      // Attach the Prisma user id to the session object
      if (user) session.user = { ...session.user, id: user.id }
      return session
    }
  }
}
