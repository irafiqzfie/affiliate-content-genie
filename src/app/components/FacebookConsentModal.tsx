'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import styles from './ConsentModal.module.css';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className={styles.accordionSection}>
      <button 
        className={styles.accordionButton} 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={isOpen}
        type="button"
      >
        <span>{title}</span>
        <span className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className={`${styles.accordionContent} ${styles.open}`}>
          <div className={styles.accordionInner}>{children}</div>
        </div>
      )}
    </div>
  );
}

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
  const [accordionStates, setAccordionStates] = useState({
    notAccess: false,
    twoColumn: false,
  });

  const toggleAccordion = (key: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    <div className={styles.consentModalOverlay} onClick={onClose}>
      <div className={styles.consentModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.consentModalHeader}>
          <h2 className={styles.consentModalTitle}>🔐 Connect with Facebook</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.consentModalContent}>
          <div className={styles.modalDescription}>
            <p>
              <strong>Inabiz Online</strong> would like to access your Facebook account to provide you with a seamless experience.
            </p>
          </div>

          <div className={styles.modalSection}>
            <h3>📋 What We Will Access</h3>
            <div className={styles.permissionList}>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✓</div>
                <div className={styles.permissionDesc}>
                  <strong>Public Profile</strong>
                  <p>Your name and profile picture</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✓</div>
                <div className={styles.permissionDesc}>
                  <strong>Email Address</strong>
                  <p>Your email registered with Facebook</p>
                </div>
              </div>
            </div>
          </div>

          <AccordionSection
            title="🚫 What We Will NOT Access"
            isOpen={accordionStates.notAccess}
            onToggle={() => toggleAccordion('notAccess')}
          >
            <div className={styles.permissionList}>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Friends List</strong>
                  <p>Your Facebook friends or social graph</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Posts & Photos</strong>
                  <p>Your Facebook posts, photos, or timeline</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Messages</strong>
                  <p>Your private messages or conversations</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Pages & Groups</strong>
                  <p>Pages you manage or groups you&apos;re in</p>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="🔒 Compliance Information"
            isOpen={accordionStates.twoColumn}
            onToggle={() => toggleAccordion('twoColumn')}
          >
            <div className={styles.complianceGrid}>
              <div className={styles.complianceCard}>
                <h4>How We Use Your Data</h4>
                <ul className={styles.complianceList}>
                  <li>Authenticate your identity securely</li>
                  <li>Display your name and profile picture in the app</li>
                  <li>Send important notifications to your email</li>
                  <li>Provide personalized content generation services</li>
                </ul>
              </div>
              <div className={styles.complianceCard}>
                <h4>🛡️ Your Privacy Rights</h4>
                <ul className={styles.complianceList}>
                  <li>You can revoke access anytime through Facebook Settings → Apps and Websites</li>
                  <li>You can delete your account and all data through our <a href="/delete-data" target="_blank" rel="noopener noreferrer">Data Deletion page</a></li>
                  <li>We never sell your data to third parties</li>
                  <li>Read our full <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </AccordionSection>

          <div style={{marginTop:"1rem"}}>
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
              </span>
            </label>
          </div>
        </div>

        <div className={styles.consentModalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            className={styles.authorizeButton}
            onClick={handleAccept}
            disabled={!isAccepted || isLoading}
          >
            {isLoading ? 'Connecting...' : 'Accept & Continue'}
          </button>

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
    </div>
  );
}
