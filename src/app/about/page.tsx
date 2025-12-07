import type { Metadata } from 'next';
import Link from 'next/link';
import AuthButton from '../components/AuthButton';

export const metadata: Metadata = {
  title: 'About Us | Inabiz Online',
  description: 'Learn about Inabiz Online (Master Serve Enterprise) - Your trusted partner for quality family & household products and expert marketing content services.',
};

export default function AboutPage() {
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
            <h1>About Us</h1>
            
            <div className="about-section">
              <p className="intro-text">
                Welcome to <strong>Inabiz Online</strong>, legally registered as{' '}
                <strong>MASTER SERVE ENTERPRISE</strong>
                <br />
                (SSM Registration No: TR0276566-V).
              </p>
            </div>

            <div className="about-section contact-info">
              <h2>Contact Information</h2>
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

            <div className="about-section mission">
              <h2>Our Mission</h2>
              <p>
                To deliver quality, affordable family and household products to every Malaysian home 
                with speed, reliability, and a smile—and empower businesses by providing effective, 
                engaging marketing content.
              </p>
            </div>

            <div className="about-section values">
              <h2>Core Values</h2>
              <div className="values-grid">
                <div className="value-card">
                  <h3>🤝 Integrity</h3>
                  <p>Committed to honest, ethical practices in every aspect of our operations.</p>
                </div>
                <div className="value-card">
                  <h3>👥 Customer Focus</h3>
                  <p>Placing customer satisfaction at the heart of our business.</p>
                </div>
                <div className="value-card">
                  <h3>💡 Innovation</h3>
                  <p>Embracing new ideas and technologies for better shopping and marketing solutions.</p>
                </div>
                <div className="value-card">
                  <h3>🌟 Community</h3>
                  <p>Supporting the community and local causes.</p>
                </div>
                <div className="value-card">
                  <h3>✨ Quality</h3>
                  <p>Maintaining the highest product and content standards.</p>
                </div>
              </div>
            </div>

            <div className="about-section business-type">
              <h2>Business Type</h2>
              <p>
                Established in <strong>2024</strong>, Inabiz Online specializes in the retail sale of 
                family & household products (miscellaneous) over the internet, and also provides expert 
                services in generating content for marketing—helping you promote your brand and connect 
                with your audience more effectively.
              </p>
            </div>

            <div className="about-section closing">
              <p className="closing-text">
                Thank you for choosing <strong>Inabiz Online</strong>. For any inquiries, feel free to 
                contact us—we&apos;re here to help.
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
