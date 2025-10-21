import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import { authOptions } from './authOptions'

// App Router expects explicit GET/POST exports. NextAuth returns handlers we can re-export.
const handler = NextAuth(authOptions as NextAuthOptions)
export { handler as GET, handler as POST }
