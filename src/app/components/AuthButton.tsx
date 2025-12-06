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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Sign In
      </button>

      <SignInModal 
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <style jsx>{`
        .auth-button-signin {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 11px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }

        .auth-button-signin::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .auth-button-signin:hover::before {
          opacity: 1;
        }

        .auth-button-signin:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .auth-button-signin:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .auth-button-signin svg,
        .auth-button-signin span {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  )
}
