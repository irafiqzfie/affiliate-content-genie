"use client"

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import SignInModal from './SignInModal'

export default function AuthButton() {
  const { data: session } = useSession()
  const [showSignInModal, setShowSignInModal] = useState(false)

  if (session) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div className="user-info">
          {session.user?.image && (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="user-avatar"
            />
          )}
          <span className="user-name">{session.user?.name || session.user?.email}</span>
        </div>
        <button 
          onClick={() => signOut()} 
          className="auth-button auth-button-signout"
        >
          Sign Out
        </button>

        <style jsx>{`
          .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--glass-bg);
            border-radius: 8px;
            border: 1px solid var(--glass-border);
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }

          .user-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
          }

          .auth-button-signout {
            padding: 10px 20px;
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .auth-button-signout:hover {
            background: #e0e0e0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <button 
        onClick={() => setShowSignInModal(true)}
        className="auth-button auth-button-signin"
      >
        Sign In
      </button>

      <SignInModal 
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <style jsx>{`
        .auth-button-signin {
          padding: 10px 24px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-button-signin:hover {
          background: #1565c0;
        }
      `}</style>
    </>
  )
}
