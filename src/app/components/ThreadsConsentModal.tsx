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
      {isOpen && <div className={`${styles.accordionContent} ${styles.open}`}>{children}</div>}
    </div>
  );
}

interface ThreadsConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThreadsConsentModal({ isOpen, onClose }: ThreadsConsentModalProps) {
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

  if (!isOpen) return null;
  if (!mounted) return null;

  const handleAccept = async () => {
    if (!isAccepted) return;
    
    setIsLoading(true);
    try {
      await signIn('threads', { callbackUrl: '/' });
    } catch (error) {
      console.error('Threads sign in error:', error);
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className={styles.consentModalOverlay} onClick={onClose}>
      <div className={styles.consentModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.consentModalHeader}>
          <h2>🧵 Connect with Threads</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.consentModalContent}>
          <div className={styles.modalDescription}>
            <p>
              <strong>Inabiz Online</strong> would like to connect with your Threads account to enable direct posting to Threads.
            </p>
          </div>

          <div className={styles.modalSection}>
            <h3>📋 What We Will Access</h3>
            <div className={styles.permissionList}>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✓</div>
                <div className={styles.permissionDesc}>
                  <strong>Basic Profile</strong>
                  <p>Your username, name, and profile picture</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✓</div>
                <div className={styles.permissionDesc}>
                  <strong>Content Publishing</strong>
                  <p>Ability to post text and media to your Threads profile</p>
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
                  <strong>Private Messages</strong>
                  <p>Your direct messages or conversations</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Following/Followers</strong>
                  <p>Your followers list or who you follow</p>
                </div>
              </div>
              <div className={styles.permissionItem}>
                <div className={styles.permissionName}>✗</div>
                <div className={styles.permissionDesc}>
                  <strong>Analytics</strong>
                  <p>Your post insights or engagement metrics</p>
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
                  <li>Authenticate your Threads identity</li>
                  <li>Display your Threads username and profile picture</li>
                  <li>Post affiliate content to your Threads account when you schedule it</li>
                  <li>Store your access token securely for posting</li>
                </ul>
              </div>
              <div className={styles.complianceCard}>
                <h4>🛡️ Your Privacy Rights</h4>
                <ul className={styles.complianceList}>
                  <li>You can disconnect Threads anytime through your account settings</li>
                  <li>You can delete your account and all data through our <a href="/delete-data" target="_blank" rel="noopener noreferrer">Data Deletion page</a></li>
                  <li>We never sell your data to third parties</li>
                  <li>Read our full <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </AccordionSection>

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
            className="consent-btn consent-btn-accept threads-button"
            onClick={handleAccept}
            disabled={!isAccepted || isLoading}
          >
            {isLoading ? 'Connecting...' : 'Accept & Continue'}
          </button>
        </div>
      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
}

