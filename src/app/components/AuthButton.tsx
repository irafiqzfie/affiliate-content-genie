"use client"

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import FacebookConsentModal from './FacebookConsentModal'

export default function AuthButton() {
  const { data: session } = useSession()
  const [showConsentModal, setShowConsentModal] = useState(false)

  if (session) {
    return (
      <div className="auth-signed-in">
        <div className="auth-user-info">
          <div className="auth-avatar">
            {session.user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="auth-email">{session.user?.email}</span>
        </div>
        <button onClick={() => signOut()} className="auth-button auth-button-signout">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <button 
        onClick={() => setShowConsentModal(true)} 
        className="auth-button auth-button-signin"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
        </svg>
        Sign in
      </button>

      <FacebookConsentModal 
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
      />
    </>
  )
}
