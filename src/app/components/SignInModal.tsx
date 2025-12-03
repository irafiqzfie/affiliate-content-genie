'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { createPortal } from 'react-dom';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Sign up failed');
          setLoading(false);
          return;
        }

        // After successful signup, sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Account created but sign in failed. Please try signing in manually.');
        } else {
          onClose();
          window.location.reload();
        }
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Invalid email or password');
        } else {
          onClose();
          window.location.reload();
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
          <p className="modal-subtitle">
            {mode === 'signin' 
              ? 'Welcome back! Sign in to access your account' 
              : 'Get started with your free account'}
          </p>
        </div>

        <div className="modal-body">
          {/* Mode Toggle */}
          <div className="auth-mode-toggle">
            <button
              className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  className="link-btn"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  className="link-btn"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }

        .signin-modal {
          max-width: 450px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          position: relative;
          z-index: 10000;
        }

        .modal-close {
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

        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .modal-header {
          padding: 32px 32px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #1a1a1a;
        }

        .modal-subtitle {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .modal-body {
          padding: 24px 32px 32px;
        }

        .auth-mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 8px;
        }

        .mode-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: white;
          color: #1976d2;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .form-group input {
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #1976d2;
        }

        .error-message {
          padding: 12px 16px;
          background: #ffebee;
          color: #c62828;
          border-radius: 8px;
          font-size: 14px;
        }

        .btn-primary {
          padding: 14px 20px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .link-btn {
          background: none;
          border: none;
          color: #1976d2;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .link-btn:hover {
          color: #1565c0;
        }

        @media (max-width: 768px) {
          .modal-content {
            margin: 1rem;
          }

          .modal-header {
            padding: 24px 20px 16px;
          }

          .modal-body {
            padding: 16px 20px 24px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
