'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

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
        
        {/* Logo Header */}
        <div className="modal-brand">
          <div className="brand-logo-wrapper">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} className="brand-logo" />
          </div>
          <h1 className="brand-title">Affiliate Content Genie</h1>
        </div>

        <div className="modal-header">
          <h2>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="modal-subtitle">
            {mode === 'signin' 
              ? 'Sign in to access your saved content and scheduled posts' 
              : 'Start creating amazing content with AI'}
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
                Don&apos;t have an account?{' '}
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
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          backdrop-filter: blur(12px);
          animation: fadeIn 0.25s ease-out;
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
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .signin-modal {
          max-width: 700px;
          width: 90%;
        }

        .modal-content {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(37, 99, 235, 0.15);
          position: relative;
          z-index: 10000;
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 24px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          transition: all 0.2s ease;
          z-index: 10;
          font-weight: 300;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
          transform: scale(1.05);
        }

        .modal-brand {
          padding: 28px 32px 16px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-logo-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          margin-bottom: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .brand-logo {
          filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4));
        }

        .brand-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .modal-header {
          padding: 24px 32px 20px;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 6px 0;
          font-size: 24px;
          color: #f0f2f5;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .modal-subtitle {
          margin: 0;
          color: rgba(240, 242, 245, 0.7);
          font-size: 14px;
          line-height: 1.4;
        }

        .modal-body {
          padding: 0 32px 32px;
        }

        .auth-mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: rgba(0, 0, 0, 0.3);
          padding: 5px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mode-btn {
          flex: 1;
          padding: 10px 14px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          color: rgba(240, 242, 245, 0.6);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mode-btn:hover {
          color: rgba(240, 242, 245, 0.8);
          background: rgba(255, 255, 255, 0.05);
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 
            0 4px 12px rgba(37, 99, 235, 0.3),
            0 0 0 1px rgba(37, 99, 235, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(240, 242, 245, 0.9);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-group input {
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: rgba(0, 0, 0, 0.2);
          color: #f0f2f5;
          backdrop-filter: blur(10px);
        }

        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
          background: rgba(0, 0, 0, 0.3);
          box-shadow: 
            0 0 0 3px rgba(37, 99, 235, 0.15),
            0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .form-group input::placeholder {
          color: rgba(240, 242, 245, 0.4);
        }

        .form-group input:-webkit-autofill,
        .form-group input:-webkit-autofill:hover,
        .form-group input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f0f2f5;
          -webkit-box-shadow: 0 0 0 30px rgba(0, 0, 0, 0.3) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .error-message {
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-left: 4px solid #dc2626;
          color: #fca5a5;
          border-radius: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.4s ease, fadeIn 0.3s ease;
          backdrop-filter: blur(10px);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        .btn-primary {
          padding: 14px 24px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 4px 16px rgba(37, 99, 235, 0.4),
            0 0 0 1px rgba(37, 99, 235, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .btn-primary:hover:not(:disabled)::before {
          left: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 24px rgba(37, 99, 235, 0.5),
            0 0 0 1px rgba(37, 99, 235, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 
            0 2px 8px rgba(37, 99, 235, 0.4),
            0 0 0 1px rgba(37, 99, 235, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: 
            0 2px 8px rgba(37, 99, 235, 0.2),
            0 0 0 1px rgba(37, 99, 235, 0.3);
        }

        .auth-footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          font-size: 13px;
          color: rgba(240, 242, 245, 0.6);
        }

        .link-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .link-btn:hover {
          color: #60a5fa;
          text-decoration: none;
          text-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
        }

        /* Custom Scrollbar */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0 24px 24px 0;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .modal-content {
            margin: 1rem;
            border-radius: 20px;
          }

          .modal-brand {
            padding: 32px 24px 20px;
          }

          .brand-logo-wrapper {
            width: 64px;
            height: 64px;
          }

          .brand-title {
            font-size: 16px;
          }

          .modal-header {
            padding: 24px 24px 20px;
          }

          .modal-header h2 {
            font-size: 24px;
          }

          .modal-subtitle {
            font-size: 14px;
          }

          .modal-body {
            padding: 0 24px 32px;
          }

          .modal-close {
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
