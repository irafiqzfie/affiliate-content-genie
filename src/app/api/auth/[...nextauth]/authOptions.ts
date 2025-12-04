import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
  // Don't use PrismaAdapter with Credentials provider - incompatible
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Missing email or password');
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            console.error('❌ User not found or no password set');
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.error('❌ Invalid password');
            return null;
          }

          console.log('✅ User authenticated:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('❌ Authentication error:', error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 24 * 60 * 60, // 60 days
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log('🔐 User signed in:', user?.email);
    },
    async signOut() {
      console.log('👋 User signed out');
    }
  }
}
