import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <h1>🛡️ Privacy Policy</h1>
          <p className="last-updated">Last updated: November 2025</p>
        </header>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              Affiliate Content Genie (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect information when you use our website, app, and connected services (the &quot;Service&quot;).
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Information We Collect</h2>
            <p>We collect the following information to provide and improve our Service:</p>
            <ul>
              <li>
                <strong>Account information</strong> — such as your name, email, and profile image when you sign in with Facebook, Google, or other OAuth providers.
              </li>
              <li>
                <strong>Content data</strong> — text, images, or links you generate, save, or schedule within the app.
              </li>
              <li>
                <strong>Analytics data</strong> — anonymized usage information such as browser type, device, and page interactions (for performance improvement).
              </li>
            </ul>
            <p>We do not collect passwords or private social media data without your consent.</p>
          </section>

          <section className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service.</li>
              <li>Enable sign-in and secure authentication.</li>
              <li>Allow you to save, analyze, and schedule social media content.</li>
              <li>Communicate updates or service-related information.</li>
            </ul>
            <p className="highlight">We never sell or rent your personal data to third parties.</p>
          </section>

          <section className="privacy-section">
            <h2>4. Data Storage and Security</h2>
            <p>
              All data is stored securely on encrypted databases managed by our hosting providers (Vercel, Supabase, or similar). We take reasonable technical measures to protect your information from unauthorized access or disclosure.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Third-Party Services</h2>
            <p>We integrate with third-party platforms such as:</p>
            <ul>
              <li>
                <strong>Facebook / Meta</strong> (for login and optional content publishing)
              </li>
              <li>
                <strong>Shopee</strong> (for fetching public product data)
              </li>
            </ul>
            <p>These services are governed by their own privacy policies.</p>
          </section>

          <section className="privacy-section">
            <h2>6. Your Rights</h2>
            <p>You may request access to or deletion of your personal data by contacting us at:</p>
            <p className="contact-email">
              📧 <a href="mailto:support@inabiz.online">support@inabiz.online</a>
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. Changes</h2>
            <p>
              We may update this policy occasionally. Updates will be reflected with a new &quot;Last updated&quot; date.
            </p>
          </section>
        </div>

        <footer className="privacy-footer">
          <Link href="/" className="back-link">← Back to Home</Link>
        </footer>
      </div>
    </div>
  );
}
