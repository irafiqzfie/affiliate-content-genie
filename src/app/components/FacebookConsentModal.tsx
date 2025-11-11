'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface FacebookConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FBAuthResponse {
  accessToken: string;
  userID: string;
  expiresIn: number;
}

interface FBStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: FBAuthResponse;
}

interface FacebookSDK {
  getLoginStatus: (callback: (response: FBStatusResponse) => void) => void;
  login?: (callback: (response: FBStatusResponse) => void, options?: { scope: string }) => void;
}

declare global {
  interface Window {
    FB: FacebookSDK;
    checkLoginState?: () => void;
  }
}

export default function FacebookConsentModal({ isOpen, onClose }: FacebookConsentModalProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Define checkLoginState globally for Facebook button callback
    window.checkLoginState = function() {
      if (typeof window.FB !== 'undefined') {
        window.FB.getLoginStatus(function(response: FBStatusResponse) {
          statusChangeCallback(response);
        });
      }
    };

    return () => {
      // Cleanup
      if (window.checkLoginState) {
        delete window.checkLoginState;
      }
    };
  }, []);

  const statusChangeCallback = (response: FBStatusResponse) => {
    console.log('Facebook Login Status from Button:', response);
    
    if (response.status === 'connected') {
      console.log('✅ User logged in via Facebook button');
      // Trigger NextAuth sign in with the Facebook token
      setIsLoading(true);
      signIn('facebook', { callbackUrl: '/' });
    }
  };

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!isAccepted) return;
    
    setIsLoading(true);
    try {
      await signIn('facebook', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="consent-modal-overlay" onClick={onClose}>
      <div className="consent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="consent-modal-header">
          <h2>🔐 Connect with Facebook</h2>
          <button className="consent-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="consent-modal-content">
          <div className="consent-intro">
            <p>
              <strong>Inabiz Online</strong> would like to access your Facebook account to provide you with a seamless experience.
            </p>
          </div>

          <div className="consent-section">
            <h3>📋 What We Will Access</h3>
            <div className="permission-list">
              <div className="permission-item granted">
                <div className="permission-icon">✓</div>
                <div className="permission-details">
                  <strong>Public Profile</strong>
                  <p>Your name and profile picture</p>
                </div>
              </div>
              <div className="permission-item granted">
                <div className="permission-icon">✓</div>
                <div className="permission-details">
                  <strong>Email Address</strong>
                  <p>Your email registered with Facebook</p>
                </div>
              </div>
            </div>
          </div>

          <div className="consent-section">
            <h3>🚫 What We Will NOT Access</h3>
            <div className="permission-list">
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Friends List</strong>
                  <p>Your Facebook friends or social graph</p>
                </div>
              </div>
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Posts & Photos</strong>
                  <p>Your Facebook posts, photos, or timeline</p>
                </div>
              </div>
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Messages</strong>
                  <p>Your private messages or conversations</p>
                </div>
              </div>
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Pages & Groups</strong>
                  <p>Pages you manage or groups you&apos;re in</p>
                </div>
              </div>
            </div>
          </div>

          <div className="consent-section">
            <h3>🔒 How We Use Your Data</h3>
            <ul className="usage-list">
              <li>Authenticate your identity securely</li>
              <li>Display your name and profile picture in the app</li>
              <li>Send important notifications to your email</li>
              <li>Provide personalized content generation services</li>
            </ul>
          </div>

          <div className="consent-section highlight-box">
            <h3>🛡️ Your Privacy Rights</h3>
            <ul className="privacy-rights-list">
              <li>You can revoke access anytime through Facebook Settings → Apps and Websites</li>
              <li>You can delete your account and all data through our <a href="/delete-data" target="_blank" rel="noopener noreferrer">Data Deletion page</a></li>
              <li>We never sell your data to third parties</li>
              <li>Read our full <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="consent-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
              />
              <span>
                I have read and agree to the{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                {' '}and{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                {', '}and I consent to Inabiz Online accessing my Facebook public profile and email address.
              </span>
            </label>
          </div>
        </div>

        <div className="consent-modal-footer">
          <button
            className="consent-btn consent-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {/* Option 1: Custom styled button via NextAuth */}
          <button
            className="consent-btn consent-btn-accept"
            onClick={handleAccept}
            disabled={!isAccepted || isLoading}
          >
            {isLoading ? 'Connecting...' : 'Accept & Continue with Facebook'}
          </button>

          {/* Option 2: Official Facebook Login Button (hidden by default, shown if XFBML enabled) */}
          {isAccepted && (
            <div className="fb-login-button-container">
              <div 
                className="fb-login-button" 
                data-width="300"
                data-size="large"
                data-button-type="continue_with"
                data-layout="default"
                data-auto-logout-link="false"
                data-use-continue-as="true"
                data-scope="public_profile,email"
                data-onlogin="checkLoginState"
              ></div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .consent-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
          overflow-y: auto;
        }

        .consent-modal {
          background: linear-gradient(135deg, rgba(13, 15, 27, 0.98), rgba(20, 25, 40, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .consent-modal-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .consent-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--primary-text-color);
          font-weight: 700;
        }

        .consent-close-btn {
          background: none;
          border: none;
          color: var(--secondary-text-color);
          font-size: 2rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          line-height: 1;
        }

        .consent-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-text-color);
        }

        .consent-modal-content {
          padding: 1.5rem 2rem;
          max-height: calc(90vh - 180px);
          overflow-y: auto;
        }

        .consent-intro {
          margin-bottom: 1.5rem;
        }

        .consent-intro p {
          font-size: 1rem;
          color: var(--secondary-text-color);
          line-height: 1.6;
          margin: 0;
        }

        .consent-section {
          margin-bottom: 2rem;
        }

        .consent-section h3 {
          font-size: 1.1rem;
          color: var(--primary-text-color);
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .permission-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .permission-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .permission-item.granted {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .permission-item.denied {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .permission-icon {
          min-width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: bold;
          border-radius: 50%;
        }

        .permission-item.granted .permission-icon {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .permission-item.denied .permission-icon {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .permission-details strong {
          display: block;
          color: var(--primary-text-color);
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }

        .permission-details p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--secondary-text-color);
          line-height: 1.4;
        }

        .usage-list,
        .privacy-rights-list {
          margin: 0;
          padding-left: 1.5rem;
          color: var(--secondary-text-color);
          line-height: 1.8;
        }

        .usage-list li,
        .privacy-rights-list li {
          margin-bottom: 0.5rem;
        }

        .highlight-box {
          background: rgba(255, 123, 0, 0.05);
          border: 1px solid rgba(255, 123, 0, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .highlight-box h3 {
          margin-top: 0;
        }

        .privacy-rights-list a,
        .consent-checkbox a {
          color: #00aaff;
          text-decoration: none;
          font-weight: 500;
        }

        .privacy-rights-list a:hover,
        .consent-checkbox a:hover {
          text-decoration: underline;
        }

        .consent-checkbox {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .consent-checkbox label {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          cursor: pointer;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--secondary-text-color);
        }

        .consent-checkbox input[type="checkbox"] {
          margin-top: 0.25rem;
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .consent-modal-footer {
          padding: 1.5rem 2rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .consent-btn {
          padding: 0.875rem 1.75rem;
          border-radius: 9999px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .consent-btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-text-color);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .consent-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .consent-btn-accept {
          background: linear-gradient(135deg, #1877f2 0%, #0e5fc9 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
        }

        .consent-btn-accept:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.4);
        }

        .consent-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .fb-login-button-container {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .consent-modal {
            max-width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 95vh;
          }

          .consent-modal-header,
          .consent-modal-content,
          .consent-modal-footer {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }

          .consent-modal-header h2 {
            font-size: 1.25rem;
          }

          .permission-item {
            padding: 0.875rem;
          }

          .consent-modal-footer {
            flex-direction: column;
          }

          .consent-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .consent-modal-overlay {
            padding: 0;
          }

          .consent-modal {
            border-radius: 0;
            max-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
