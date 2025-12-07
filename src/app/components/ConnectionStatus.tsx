'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { ThreadsIcon } from './ThreadsIcon';
import { FacebookIcon } from './FacebookIcon';

interface Connection {
  id: string;
  provider: string;
  providerAccountId: string;
  pageId?: string | null;
  pageName?: string | null;
  threadsUserId?: string | null;
  expires_at?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Connections {
  threads: Connection | null;
  facebook: Connection[];
}

interface ConnectionStatusProps {
  onConnectionChange?: () => void;
}

export default function ConnectionStatus({ onConnectionChange }: ConnectionStatusProps) {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<Connections | null>(null);
  const [showModal, setShowModal] = useState<'threads' | 'facebook' | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchConnections();
    }
  }, [session]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/auth/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const connectThreads = async () => {
    setConnecting('threads');
    try {
      const response = await fetch('/api/auth/threads/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        alert('Failed to initiate Threads connection');
        setConnecting(null);
      }
    } catch (error) {
      console.error('Error connecting Threads:', error);
      alert('Error connecting Threads');
      setConnecting(null);
    }
  };

  const connectFacebook = async () => {
    setConnecting('facebook');
    try {
      const response = await fetch('/api/auth/facebook/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        alert('Failed to initiate Facebook connection');
        setConnecting(null);
      }
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      alert('Error connecting Facebook');
      setConnecting(null);
    }
  };

  const disconnectProvider = async (provider: string, accountId?: string) => {
    if (!confirm(`Disconnect ${provider}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, accountId }),
      });

      if (response.ok) {
        await fetchConnections();
        if (onConnectionChange) onConnectionChange();
      } else {
        alert('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Error disconnecting');
    }
  };

  const isExpiringSoon = (expiresAt: number | null | undefined): boolean => {
    if (!expiresAt) return false;
    const now = Math.floor(Date.now() / 1000);
    const daysUntilExpiry = (expiresAt - now) / (24 * 60 * 60);
    return daysUntilExpiry < 7;
  };

  if (!session?.user) {
    return null;
  }

  const threadsConnected = !!connections?.threads;
  const facebookConnected = connections?.facebook && connections.facebook.length > 0;

  return (
    <>
      {/* Status Indicators */}
      <div className="connection-status-indicators">
        {/* Threads */}
        <button
          className={`status-indicator ${threadsConnected ? 'connected' : 'disconnected'}`}
          onClick={() => setShowModal('threads')}
          title={threadsConnected ? 'Threads: Connected' : 'Threads: Not Connected'}
        >
          <span className="status-icon">
            <ThreadsIcon size={18} />
          </span>
          {connections?.threads?.expires_at &&
            connections.threads &&
            isExpiringSoon(connections.threads.expires_at) && (
              <span className="warning-dot">⚠️</span>
            )}
        </button>

        {/* Facebook Pages */}
        <button
          className={`status-indicator ${facebookConnected ? 'connected' : 'disconnected'}`}
          onClick={() => setShowModal('facebook')}
          title={
            facebookConnected
              ? `Facebook: ${connections?.facebook.length} page(s)`
              : 'Facebook: Not Connected'
          }
        >
          <span className="status-icon">
            <FacebookIcon size={18} />
          </span>
          {facebookConnected && connections?.facebook && (
            <span className="count-badge">{connections.facebook.length}</span>
          )}
        </button>
      </div>

      {/* Threads Modal */}
      {mounted && showModal === 'threads' && createPortal(
        <div className="connection-modal-overlay" onClick={() => setShowModal(null)}>
          <div className="connection-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="connection-modal-close" onClick={() => setShowModal(null)}>×</button>
            
            <div className="modal-header">
              <span className="modal-icon">
                <ThreadsIcon size={20} />
              </span>
              <h3>Threads Connection</h3>
            </div>

            {threadsConnected ? (
              <div className="modal-body">
                <div className="connection-info">
                  <span className="status-badge connected">✓ Connected</span>
                  <p className="account-id">Account: {connections?.threads?.threadsUserId}</p>
                  {connections?.threads?.expires_at && (
                    <p className={`expiry-info ${isExpiringSoon(connections.threads.expires_at) ? 'warning' : ''}`}>
                      {isExpiringSoon(connections.threads.expires_at) 
                        ? '⚠️ Token expiring soon' 
                        : '✅ Token valid'}
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button onClick={connectThreads} className="btn-secondary">
                    Reconnect
                  </button>
                  <button onClick={() => disconnectProvider('threads')} className="btn-danger">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <p className="modal-description">Connect your Threads account to publish posts directly from this app.</p>
                <button
                  onClick={connectThreads}
                  disabled={connecting === 'threads'}
                  className="btn-primary"
                >
                  {connecting === 'threads' ? 'Connecting...' : 'Connect Threads'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Facebook Modal */}
      {mounted && showModal === 'facebook' && createPortal(
        <div className="connection-modal-overlay" onClick={() => setShowModal(null)}>
          <div className="connection-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="connection-modal-close" onClick={() => setShowModal(null)}>×</button>
            
            <div className="modal-header">
              <span className="modal-icon">
                <FacebookIcon size={20} />
              </span>
              <h3>Facebook Pages</h3>
            </div>

            {facebookConnected ? (
              <div className="modal-body">
                <div className="connection-info">
                  <span className="status-badge connected">✓ {connections?.facebook.length} Page(s) Connected</span>
                </div>
                <div className="pages-list-modal">
                  {connections?.facebook.map((page) => (
                    <div key={page.id} className="page-item-modal">
                      <div className="page-info-modal">
                        <strong>{page.pageName}</strong>
                        {page.expires_at && isExpiringSoon(page.expires_at) && (
                          <span className="warning-badge">⚠️ Expiring soon</span>
                        )}
                      </div>
                      <button
                        onClick={() => disconnectProvider('facebook-pages', page.id)}
                        className="btn-danger-small"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                  <button onClick={connectFacebook} className="btn-secondary">
                    Add More Pages
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <p className="modal-description">Connect your Facebook Pages to publish posts directly from this app.</p>
                <button
                  onClick={connectFacebook}
                  disabled={connecting === 'facebook'}
                  className="btn-primary"
                >
                  {connecting === 'facebook' ? 'Connecting...' : 'Connect Facebook Pages'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .connection-status-indicators {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .status-indicator {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .status-indicator.connected {
          background: linear-gradient(135deg, rgba(255, 123, 0, 0.15) 0%, rgba(0, 170, 255, 0.15) 100%);
          border-color: rgba(255, 123, 0, 0.5);
          box-shadow: 0 4px 12px rgba(255, 123, 0, 0.2);
        }

        .status-indicator.disconnected {
          background: rgba(13, 15, 27, 0.5);
          border: 2px dashed rgba(255, 255, 255, 0.18);
          opacity: 0.6;
        }

        .status-indicator:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 123, 0, 0.3);
        }

        .status-indicator.disconnected:hover {
          opacity: 1;
          border-color: rgba(255, 123, 0, 0.3);
          box-shadow: 0 4px 12px rgba(255, 123, 0, 0.15);
        }

        .status-icon {
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .warning-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 14px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }

        .count-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ff7b00, #00aaff);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 12px;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(255, 123, 0, 0.4);
        }

        .connection-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(13, 15, 27, 0.85);
          backdrop-filter: blur(8px);
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .connection-modal-content {
          background: rgba(26, 28, 48, 0.95);
          border: 2px solid rgba(255, 123, 0, 0.3);
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(255, 123, 0, 0.3), 
                      0 8px 24px rgba(0, 0, 0, 0.5);
          position: relative;
          animation: slideUp 0.3s ease-out;
        }

        .connection-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 24px;
          color: rgba(240, 242, 245, 0.7);
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .connection-modal-close:hover {
          background: rgba(255, 123, 0, 0.2);
          border-color: rgba(255, 123, 0, 0.5);
          color: #f0f2f5;
          transform: rotate(90deg);
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 28px 28px 20px;
          border-bottom: 2px solid rgba(255, 123, 0, 0.2);
          background: linear-gradient(135deg, rgba(255, 123, 0, 0.05) 0%, rgba(0, 170, 255, 0.05) 100%);
        }

        .modal-icon {
          font-size: 36px;
          filter: drop-shadow(0 2px 8px rgba(255, 123, 0, 0.4));
        }

        .modal-header h3 {
          font-size: 22px;
          margin: 0;
          color: #f0f2f5;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .modal-body {
          padding: 28px;
        }

        .modal-description {
          color: #d0dae8;
          margin: 0 0 24px 0;
          line-height: 1.6;
          font-size: 15px;
        }

        .connection-info {
          margin-bottom: 24px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .status-badge.connected {
          background: linear-gradient(135deg, rgba(78, 222, 128, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%);
          border: 2px solid rgba(78, 222, 128, 0.5);
          color: #4ade80;
        }

        .account-id {
          font-size: 14px;
          color: #8b97ad;
          margin: 10px 0;
          padding: 12px;
          background: rgba(13, 15, 27, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: 'Courier New', monospace;
        }

        .expiry-info {
          font-size: 14px;
          margin: 12px 0 0 0;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(13, 15, 27, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .expiry-info.warning {
          background: rgba(251, 191, 36, 0.15);
          border-color: rgba(251, 191, 36, 0.4);
          color: #fbbf24;
          font-weight: 600;
        }

        .pages-list-modal {
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .page-item-modal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(13, 15, 27, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .page-item-modal:hover {
          background: rgba(40, 43, 73, 0.6);
          border-color: rgba(255, 123, 0, 0.3);
          transform: translateX(4px);
        }

        .page-info-modal {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .page-info-modal strong {
          color: #f0f2f5;
          font-size: 15px;
        }

        .warning-badge {
          font-size: 12px;
          color: #fbbf24;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }

        .btn-primary, .btn-secondary, .btn-danger, .btn-danger-small {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff7b00 0%, #00aaff 100%);
          color: white;
          width: 100%;
          box-shadow: 0 4px 16px rgba(255, 123, 0, 0.3);
          border: 2px solid transparent;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 123, 0, 0.4);
          background: linear-gradient(135deg, #ff9d40 0%, #55cdff 100%);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #f0f2f5;
          flex: 1;
          border: 2px solid rgba(255, 255, 255, 0.18);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 123, 0, 0.4);
          transform: translateY(-2px);
        }

        .btn-danger {
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
          flex: 1;
          border: 2px solid rgba(220, 38, 38, 0.3);
        }

        .btn-danger:hover {
          background: rgba(220, 38, 38, 0.25);
          border-color: rgba(220, 38, 38, 0.5);
          transform: translateY(-2px);
        }

        .btn-danger-small {
          padding: 8px 16px;
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
          font-size: 13px;
          border: 2px solid rgba(220, 38, 38, 0.3);
        }

        .btn-danger-small:hover {
          background: rgba(220, 38, 38, 0.25);
          border-color: rgba(220, 38, 38, 0.5);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        @media (max-width: 768px) {
          .connection-modal-content {
            margin: 1rem;
          }
        }
      `}</style>
    </>
  );
}
