'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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

export default function ConnectionsManager() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
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
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, accountId }),
      });

      if (response.ok) {
        fetchConnections();
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
    return daysUntilExpiry < 7; // Warning if less than 7 days
  };

  if (!session?.user) {
    return (
      <div className="connections-manager">
        <p>Please sign in to manage your social media connections.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="connections-manager">
        <p>Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="connections-manager">
      <h2>Connected Accounts</h2>
      <p className="description">
        Connect your Threads and Facebook Pages to publish content directly from this app.
      </p>

      <div className="connections-grid">
        {/* Threads Connection */}
        <div className="connection-card">
          <div className="connection-header">
            <div className="platform-info">
              <h3>🧵 Threads</h3>
              <p>Post to your Threads profile</p>
            </div>
            {connections?.threads ? (
              <span className="status-badge connected">Connected</span>
            ) : (
              <span className="status-badge disconnected">Not Connected</span>
            )}
          </div>

          {connections?.threads ? (
            <div className="connection-details">
              <p className="account-info">
                Account ID: {connections.threads.threadsUserId}
              </p>
              {connections.threads.expires_at && (
                <p className={`expiry-info ${isExpiringSoon(connections.threads.expires_at) ? 'warning' : ''}`}>
                  {isExpiringSoon(connections.threads.expires_at) 
                    ? '⚠️ Token expiring soon' 
                    : '✅ Token valid'}
                </p>
              )}
              <div className="connection-actions">
                <button
                  onClick={connectThreads}
                  disabled={connecting === 'threads'}
                  className="btn-secondary"
                >
                  Reconnect
                </button>
                <button
                  onClick={() => disconnectProvider('threads')}
                  className="btn-danger"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="connection-actions">
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

        {/* Facebook Pages Connection */}
        <div className="connection-card">
          <div className="connection-header">
            <div className="platform-info">
              <h3>📘 Facebook Pages</h3>
              <p>Post to your Facebook Pages</p>
            </div>
            {connections?.facebook && connections.facebook.length > 0 ? (
              <span className="status-badge connected">
                {connections.facebook.length} Page{connections.facebook.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="status-badge disconnected">Not Connected</span>
            )}
          </div>

          {connections?.facebook && connections.facebook.length > 0 ? (
            <div className="connection-details">
              <div className="pages-list">
                {connections.facebook.map((page) => (
                  <div key={page.id} className="page-item">
                    <div className="page-info">
                      <strong>{page.pageName}</strong>
                      <span className="page-id">ID: {page.pageId}</span>
                      {page.expires_at && isExpiringSoon(page.expires_at) && (
                        <span className="warning">⚠️ Expiring soon</span>
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
              <div className="connection-actions">
                <button
                  onClick={connectFacebook}
                  disabled={connecting === 'facebook'}
                  className="btn-secondary"
                >
                  Add More Pages
                </button>
              </div>
            </div>
          ) : (
            <div className="connection-actions">
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
      </div>

      <style jsx>{`
        .connections-manager {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .description {
          color: #666;
          margin-bottom: 2rem;
        }

        .connections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .connection-card {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .connection-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .platform-info h3 {
          font-size: 1.25rem;
          margin: 0 0 0.25rem 0;
        }

        .platform-info p {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.connected {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-badge.disconnected {
          background: #fef3e0;
          color: #f57c00;
        }

        .connection-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .account-info {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        .expiry-info {
          font-size: 0.875rem;
          margin: 0;
        }

        .expiry-info.warning {
          color: #f57c00;
          font-weight: 600;
        }

        .pages-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .page-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .page-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .page-id {
          font-size: 0.75rem;
          color: #999;
        }

        .page-info .warning {
          font-size: 0.75rem;
          color: #f57c00;
        }

        .connection-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .btn-primary, .btn-secondary, .btn-danger, .btn-danger-small {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
          flex: 1;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .btn-danger {
          background: #f5f5f5;
          color: #d32f2f;
        }

        .btn-danger:hover:not(:disabled) {
          background: #ffebee;
        }

        .btn-danger-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          background: #f5f5f5;
          color: #d32f2f;
        }

        .btn-danger-small:hover:not(:disabled) {
          background: #ffebee;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .connections-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
