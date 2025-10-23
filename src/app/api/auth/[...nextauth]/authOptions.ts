import { PrismaAdapter } from '@next-auth/prisma-adapter'
import FacebookProvider from 'next-auth/providers/facebook'
import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
    })
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
