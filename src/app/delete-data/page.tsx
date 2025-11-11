'use client';

import Link from 'next/link';
import AuthButton from '../components/AuthButton';
import { useState } from 'react';

export default function DeleteDataPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission - in production, this would email your admin or create a deletion request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setEmail('');
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 10000);
    }, 1500);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="branding">
          <div className="logo-container">
            <img src="/logo.svg" alt="Inabiz Online Logo" className="logo-icon" />
            <h1>Inabiz Online</h1>
          </div>
          <p>a MASTER SERVE innovation</p>
        </div>
        
        <nav className="unified-tab-bar">
          <Link href="/" className="unified-tab">
            <span className="tab-icon">✨</span>
            <span className="tab-label">Generator</span>
          </Link>
        </nav>
        
        <div className="header-auth">
          <Link href="/about" className="about-link">
            ℹ️ About Us
          </Link>
          <Link href="/contact" className="about-link">
            📧 Contact Us
          </Link>
          <AuthButton />
        </div>
      </header>

      <main className="main-content">
        <div className="about-page-wrapper">
          <div className="about-back-button-container">
            <Link href="/" className="about-back-button">
              ← Back to Home
            </Link>
          </div>
          
          <div className="about-content">
            <h1>🗑️ Data Deletion Request</h1>
            <p className="last-updated">Request deletion of your personal data</p>
          <section className="about-section">
            <h2>How to Delete Your Data</h2>
            <p>
              We respect your right to have your personal data deleted. You can request data deletion through any of these methods:
            </p>
          </section>

          <section className="about-section">
            <h2>Method 1: Through Facebook</h2>
            <p>If you signed in with Facebook:</p>
            <ol>
              <li>Go to your Facebook Settings & Privacy</li>
              <li>Click on &quot;Settings&quot;</li>
              <li>Go to &quot;Apps and Websites&quot;</li>
              <li>Find &quot;Inabiz Online&quot; in the list</li>
              <li>Click &quot;Remove&quot; and follow the prompts</li>
              <li>Select &quot;Delete your information from Inabiz Online&quot;</li>
            </ol>
            <p className="highlight">
              This will automatically trigger deletion of all your data from our system.
            </p>
          </section>

          <section className="about-section">
            <h2>Method 2: Email Request</h2>
            <p>Send an email to us with your account details:</p>
            <div className="contact-info-box">
              <p><strong>Email:</strong> <a href="mailto:admin@inabiz.online">admin@inabiz.online</a></p>
              <p><strong>Subject:</strong> Data Deletion Request</p>
              <p><strong>Include:</strong> Your registered email address or Facebook profile name</p>
            </div>
          </section>

          <section className="about-section">
            <h2>Method 3: Submit a Request Form</h2>
            <form onSubmit={handleSubmit} className="deletion-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Your Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus === 'success' && (
                <div className="success-message">
                  ✅ Request submitted successfully! We will process your deletion request within 30 days and send confirmation to your email.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="error-message">
                  ❌ Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Deletion Request'}
              </button>
            </form>
          </section>

          <section className="about-section">
            <h2>What Data Will Be Deleted?</h2>
            <p>When you request data deletion, we will permanently remove:</p>
            <ul>
              <li>Your account information (name, email, profile image)</li>
              <li>All saved content items</li>
              <li>All scheduled posts</li>
              <li>Your login credentials and authentication tokens</li>
              <li>Any analytics data associated with your account</li>
            </ul>
            <p className="highlight">
              <strong>Timeline:</strong> Your data will be deleted within 30 days of your request, as required by data protection regulations.
            </p>
          </section>

          <section className="about-section">
            <h2>Need Help?</h2>
            <p>
              If you have questions about data deletion or need assistance, please contact us:
            </p>
            <div className="contact-info-box">
              <p>📧 <a href="mailto:admin@inabiz.online">admin@inabiz.online</a></p>
              <p>📧 <a href="mailto:support@inabiz.online">support@inabiz.online</a></p>
              <p>📞 <a href="tel:+60145143981">014-514 3981</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>

    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-text">
          © {new Date().getFullYear()} Inabiz Online - MASTER SERVE ENTERPRISE. All rights reserved.
        </p>
        <div className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
          <Link href="/delete-data" className="footer-link">Delete My Data</Link>
        </div>
      </div>
    </footer>
  </div>
  );
}

