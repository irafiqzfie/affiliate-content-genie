'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="accordion-section">
      <button 
        className="accordion-header" 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={isOpen}
        type="button"
      >
        <span>{title}</span>
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
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
  const [accordionStates, setAccordionStates] = useState({
    notAccess: false,
    twoColumn: false,
  });

  const toggleAccordion = (key: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

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

  return (
    <div className="consent-modal-overlay" onClick={onClose}>
      <div className="consent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="consent-modal-header">
          <h2>🧵 Connect with Threads</h2>
          <button className="consent-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="consent-modal-content">
          <div className="consent-intro">
            <p>
              <strong>Inabiz Online</strong> would like to connect with your Threads account to enable direct posting to Threads.
            </p>
          </div>

          <div className="consent-section">
            <h3>📋 What We Will Access</h3>
            <div className="permission-list">
              <div className="permission-item granted">
                <div className="permission-icon">✓</div>
                <div className="permission-details">
                  <strong>Basic Profile</strong>
                  <p>Your username, name, and profile picture</p>
                </div>
              </div>
              <div className="permission-item granted">
                <div className="permission-icon">✓</div>
                <div className="permission-details">
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
            <div className="permission-list">
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Private Messages</strong>
                  <p>Your direct messages or conversations</p>
                </div>
              </div>
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
                  <strong>Following/Followers</strong>
                  <p>Your followers list or who you follow</p>
                </div>
              </div>
              <div className="permission-item denied">
                <div className="permission-icon">✗</div>
                <div className="permission-details">
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
            <div className="two-column-layout">
              <div className="column">
                <h4>How We Use Your Data</h4>
                <ul className="usage-list">
                  <li>Authenticate your Threads identity</li>
                  <li>Display your Threads username and profile picture</li>
                  <li>Post affiliate content to your Threads account when you schedule it</li>
                  <li>Store your access token securely for posting</li>
                </ul>
              </div>
              <div className="column">
                <h4>🛡️ Your Privacy Rights</h4>
                <ul className="privacy-rights-list">
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

        <div className="consent-modal-footer">
          <button
            className="consent-btn consent-btn-cancel"
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
          max-height: calc(90vh - 160px);
          overflow-y: auto;
        }

        .accordion-section {
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
        }

        .accordion-header {
          width: 100%;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--primary-text-color);
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
          text-align: left;
        }

        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .accordion-icon {
          font-size: 0.75rem;
          transition: transform 0.2s ease;
          color: var(--secondary-text-color);
        }

        .accordion-icon.open {
          transform: rotate(180deg);
        }

        .accordion-content {
          padding: 1rem 1.25rem 1.25rem;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .two-column-layout .column h4 {
          font-size: 0.95rem;
          color: var(--primary-text-color);
          margin-bottom: 0.75rem;
          font-weight: 600;
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
          padding-left: 1.25rem;
          color: var(--secondary-text-color);
          line-height: 1.6;
          font-size: 0.875rem;
        }

        .usage-list li,
        .privacy-rights-list li {
          margin-bottom: 0.4rem;
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
          padding: 1rem;
          margin-top: 1rem;
        }

        .consent-checkbox label {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          cursor: pointer;
          font-size: 0.85rem;
          line-height: 1.5;
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
          padding: 1rem 2rem 1.5rem;
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

        .threads-button {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .threads-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
        }

        .consent-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .consent-modal {
            max-width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 95vh;
          }

          .two-column-layout {
            grid-template-columns: 1fr;
            gap: 1.5rem;
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
