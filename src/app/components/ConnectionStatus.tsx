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
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .status-indicator.connected {
          border-color: #1976d2;
          background: #e3f2fd;
        }

        .status-indicator.disconnected {
          border-color: #ccc;
          background: #f5f5f5;
          opacity: 0.7;
        }

        .status-indicator:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .status-icon {
          font-size: 20px;
        }

        .warning-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 12px;
        }

        .count-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #1976d2;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .connection-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.5);
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 1000;
          padding: 1rem;
        }

        .connection-modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          position: relative;
        }

        .connection-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 28px;
          color: #999;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .connection-modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 24px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .modal-icon {
          font-size: 32px;
        }

        .modal-header h3 {
          font-size: 20px;
          margin: 0;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-description {
          color: #666;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .connection-info {
          margin-bottom: 20px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .status-badge.connected {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .account-id {
          font-size: 14px;
          color: #666;
          margin: 8px 0;
        }

        .expiry-info {
          font-size: 14px;
          margin: 8px 0 0 0;
        }

        .expiry-info.warning {
          color: #f57c00;
          font-weight: 600;
        }

        .pages-list-modal {
          margin: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .page-item-modal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .page-info-modal {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .warning-badge {
          font-size: 12px;
          color: #f57c00;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary, .btn-danger, .btn-danger-small {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
          width: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          flex: 1;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-danger {
          background: #f5f5f5;
          color: #d32f2f;
          flex: 1;
        }

        .btn-danger:hover {
          background: #ffebee;
        }

        .btn-danger-small {
          padding: 6px 12px;
          background: #f5f5f5;
          color: #d32f2f;
          font-size: 13px;
        }

        .btn-danger-small:hover {
          background: #ffebee;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
