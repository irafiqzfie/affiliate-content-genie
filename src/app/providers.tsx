"use client"

import { SessionProvider } from 'next-auth/react'
import React from 'react'
import FacebookSDK from './components/FacebookSDK'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FacebookSDK />
      {children}
    </SessionProvider>
  )
}
