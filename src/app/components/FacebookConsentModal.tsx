'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [accordionStates, setAccordionStates] = useState({
    notAccess: false,
    twoColumn: false,
  });

  const toggleAccordion = (key: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  if (!isOpen) return null;
  if (!mounted) return null;

  const modalContent = (
    <div className={styles.consentModalOverlay} onClick={onClose}>
      <div className={styles.consentModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.consentModalHeader}>
          <div className={styles.brandingHeader}>
            <div className={styles.brandingLeft}>
              <span className={styles.inabizLogo}>INABIZ</span>
              <span className={styles.brandingDivider}></span>
              <div className={styles.platformBrand}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </div>
            </div>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <h2 className={styles.consentModalTitle}>Connect with Facebook</h2>
          <p className={styles.valueProposition}>
            Share your affiliate content seamlessly and reach your audience on Facebook with one click.
          </p>
        </div>

        <div className={styles.consentModalContent}>
          <div className={styles.modalDescription}>
            <p>
              We&apos;ll use a secure OAuth connection to access your Facebook profile. Your credentials are never stored.
            </p>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>✅ What We Will Access</h3>
            <div className={styles.compactPermissionBox}>
              <ul>
                <li><strong>Public Profile:</strong> Your name and profile picture</li>
                <li><strong>Email Address:</strong> Your email registered with Facebook</li>
              </ul>
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
        </div>

        <div className={styles.consentModalFooter}>
          <div className={styles.inlineCheckbox}>
            <input
              id="facebook-consent"
              type="checkbox"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
            />
            <label htmlFor="facebook-consent">
              I have read and agree to the{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              {' '}and{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </label>
          </div>

          <div className={styles.footerButtons}>
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
          </div>

          {isAccepted && (
            <div className="fb-login-button-container" style={{ marginTop: '1rem', textAlign: 'center' }}>
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

  return createPortal(modalContent, document.body);
}
