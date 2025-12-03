"use client"

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import FacebookConsentModal from './FacebookConsentModal'
import ThreadsConsentModal from './ThreadsConsentModal'
import { ThreadsIcon } from './ThreadsIcon'

export default function AuthButton() {
  const { data: session } = useSession()
  const [showFacebookConsentModal, setShowFacebookConsentModal] = useState(false)
  const [showThreadsConsentModal, setShowThreadsConsentModal] = useState(false)

  if (session) {
    return (
      <div className="auth-signed-in">
        <div className="auth-user-info">
          <div className="auth-avatar">
            {session.user?.email?.charAt(0).toUpperCase() || session.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="auth-email">{session.user?.email?.split('@')[0] || session.user?.name}</span>
        </div>
        <button onClick={() => signOut()} className="auth-button auth-button-signout">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => setShowFacebookConsentModal(true)} 
          className="auth-button auth-button-signin facebook-signin"
          title="Sign in with Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
          </svg>
          Login
        </button>
        
        <button 
          onClick={() => setShowThreadsConsentModal(true)} 
          className="auth-button auth-button-signin threads-signin"
          title="Sign in with Threads"
        >
          <ThreadsIcon size={20} />
          Login
        </button>
      </div>

      <FacebookConsentModal 
        isOpen={showFacebookConsentModal}
        onClose={() => setShowFacebookConsentModal(false)}
      />
      
      <ThreadsConsentModal 
        isOpen={showThreadsConsentModal}
        onClose={() => setShowThreadsConsentModal(false)}
      />
    </>
  )
}
