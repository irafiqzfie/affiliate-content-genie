"use client"

import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import FacebookConsentModal from './FacebookConsentModal'
import ThreadsConsentModal from './ThreadsConsentModal'
import { ThreadsIcon } from './ThreadsIcon'

interface ConnectionStatus {
  threads: boolean;
  facebook: boolean;
}

export default function AuthButton() {
  const { data: session } = useSession()
  const [showFacebookConsentModal, setShowFacebookConsentModal] = useState(false)
  const [showThreadsConsentModal, setShowThreadsConsentModal] = useState(false)
  const [connections, setConnections] = useState<ConnectionStatus>({ threads: false, facebook: false })

  useEffect(() => {
    if (session?.user) {
      fetch('/api/auth/connections')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setConnections({
              threads: !!data.threads,
              facebook: !!(data.facebook && data.facebook.length > 0)
            })
          }
        })
        .catch(err => console.error('Failed to fetch connections:', err))
    }
  }, [session])

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
          className={`auth-button auth-button-signin facebook-signin ${connections.facebook ? 'connected' : ''}`}
          title={connections.facebook ? "Facebook Connected" : "Sign in with Facebook"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
          </svg>
          {connections.facebook ? (
            <>
              <span>Connected</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </>
          ) : 'Login'}
        </button>
        
        <button 
          onClick={() => setShowThreadsConsentModal(true)} 
          className={`auth-button auth-button-signin threads-signin ${connections.threads ? 'connected' : ''}`}
          title={connections.threads ? "Threads Connected" : "Sign in with Threads"}
        >
          <ThreadsIcon size={20} />
          {connections.threads ? (
            <>
              <span>Connected</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </>
          ) : 'Login'}
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
