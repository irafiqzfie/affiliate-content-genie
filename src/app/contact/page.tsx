'use client';

import Link from 'next/link';
import Image from 'next/image';
import AuthButton from '../components/AuthButton';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="branding">
          <div className="logo-container">
            <Image src="/logo.svg" alt="Inabiz Online Logo" className="logo-icon" width={52} height={52} />
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
            <h1>Contact Us</h1>
            
            <div className="about-section">
              <p className="intro-text">
                We value your feedback and are here to help with any questions, support, or business inquiries. 
                Reach out using any of the methods below, and our team will respond as soon as possible.
              </p>
            </div>

            <div className="about-section contact-info">
              <h2>Get in Touch</h2>
              <div className="info-grid">
                <div className="info-item">
                  <h3>📍 Address</h3>
                  <p>
                    V4-25B, BLOK L, JALAN PLUMBUM V 7/V,<br />
                    PUSAT KOMERSIAL, SEKSYEN 7,<br />
                    40000 SHAH ALAM,<br />
                    SELANGOR
                  </p>
                </div>
                <div className="info-item">
                  <h3>✉️ Email</h3>
                  <p>
                    <a href="mailto:admin@inabiz.online">admin@inabiz.online</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="about-section contact-form-section">
              <h2>Send Us a Message</h2>
              <p className="form-intro">Alternatively, fill out the form below and we will get back to you:</p>
              
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone (optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className="form-success">
                    ✓ Thank you! Your message has been sent successfully.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="form-error">
                    ✗ Sorry, there was an error sending your message. Please try again.
                  </div>
                )}

                <button 
                  type="submit" 
                  className="contact-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : '📧 Send Message'}
                </button>
              </form>
            </div>

            <div className="about-section business-hours">
              <h2>Operating Hours</h2>
              <div className="hours-grid">
                <div className="hours-item">
                  <span className="hours-label">Monday – Friday</span>
                  <span className="hours-time">9:00am – 6:00pm</span>
                </div>
                <div className="hours-item">
                  <span className="hours-label">Saturday, Sunday & Public Holidays</span>
                  <span className="hours-time">Closed</span>
                </div>
              </div>
            </div>

            <div className="about-section social-section">
              <h2>Follow Us</h2>
              <div className="social-links">
                <a href="https://www.facebook.com/home.mse/" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                  <span className="social-icon">📘</span>
                  <span className="social-label">Facebook</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                  <span className="social-icon">📷</span>
                  <span className="social-label">Instagram</span>
                </a>
              </div>
            </div>

            <div className="about-section closing">
              <p className="closing-text">
                Thank you for connecting with <strong>Inabiz Online</strong>—a MASTER SERVE product.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-text">
            © {new Date().getFullYear()} Inabiz Online - MASTER SERVE ENTERPRISE. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
