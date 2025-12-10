import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import AuthButton from '../components/AuthButton';

export const metadata: Metadata = {
  title: 'Privacy Policy | Inabiz Online',
  description: 'Privacy Policy for Inabiz Online - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-row-1">
          <div className="branding">
            <div className="logo-container">
              <a href="/" className="logo-link" aria-label="Go to homepage">
                <Image src="/logo.svg" alt="Inabiz Online Logo" className="logo-icon" width={40} height={40} priority />
              </a>
              <h1>Inabiz Online</h1>
            </div>
            <p>a MASTER SERVE innovation</p>
          </div>
          
          <nav className="header-nav-links">
            <a href="/about" className="nav-link">ℹ️ About</a>
            <a href="/contact" className="nav-link">📧 Contact</a>
          </nav>
        </div>
        
        <div className="header-row-2">
          <nav className="unified-tab-bar">
            <Link href="/" className="unified-tab">
              <span className="tab-icon">✨</span>
              <span className="tab-label">Generator</span>
            </Link>
          </nav>
          
          <div className="header-user-actions">
            <AuthButton />
          </div>
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
            <h1>🛡️ Privacy Policy</h1>
            <p className="last-updated">Last updated: November 11, 2025</p>
            <p className="sub-header">
              Inabiz Online (formerly Affiliate Content Genie) - a MASTER SERVE ENTERPRISE service
            </p>
          <section className="about-section">
            <h2>1. Introduction</h2>
            <p>
              Inabiz Online (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operated by MASTER SERVE ENTERPRISE (SSM: TR0276566-V) 
              respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, 
              use, store, and protect information when you use our website, application, and connected services (the &quot;Service&quot;).
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="about-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li>
                <strong>Account information</strong> — Name, email address, and profile image when you sign in using OAuth providers (Facebook, Google).
              </li>
              <li>
                <strong>User-generated content</strong> — Product links, text content, images, captions, and other materials you create, save, or schedule within the app.
              </li>
              <li>
                <strong>Communication data</strong> — Messages you send through contact forms or support emails.
              </li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Usage data</strong> — Pages visited, features used, time spent on the app, click patterns.
              </li>
              <li>
                <strong>Device information</strong> — Browser type, device type, operating system, IP address (anonymized).
              </li>
              <li>
                <strong>Performance data</strong> — Error logs, load times, API response times (for debugging and optimization).
              </li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <ul>
              <li>
                <strong>Facebook Login</strong> — When you use Facebook Login, we receive your public profile (name, email, profile picture, user ID) as authorized by you.
              </li>
              <li>
                <strong>Public Product Data</strong> — We may fetch publicly available product information from e-commerce platforms like Shopee based on links you provide.
              </li>
            </ul>

            <p className="highlight">
              <strong>Important:</strong> We do not collect passwords, credit card information, or access your private social media content without explicit authorization.
            </p>
          </section>

          <section className="about-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            
            <h3>3.1 Service Delivery</h3>
            <ul>
              <li>Authenticate and identify you when you sign in</li>
              <li>Provide content generation, analysis, and scheduling features</li>
              <li>Save and retrieve your saved items and scheduled posts</li>
              <li>Process and fulfill your requests within the app</li>
            </ul>

            <h3>3.2 Service Improvement</h3>
            <ul>
              <li>Analyze usage patterns to improve features and user experience</li>
              <li>Debug errors and optimize performance</li>
              <li>Develop new features based on user needs</li>
            </ul>

            <h3>3.3 Communication</h3>
            <ul>
              <li>Send service-related notifications and updates</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send important security or policy updates</li>
            </ul>

            <h3>3.4 Legal and Safety</h3>
            <ul>
              <li>Comply with legal obligations and regulations</li>
              <li>Protect against fraud, abuse, or security threats</li>
              <li>Enforce our Terms of Service</li>
            </ul>

            <p className="highlight">
              <strong>We never:</strong> Sell your personal data to third parties, use your data for advertising without consent, 
              or share your information except as described in this policy.
            </p>
          </section>

          <section className="about-section">
            <h2>4. Data Sharing and Disclosure</h2>
            
            <h3>4.1 Third-Party Service Providers</h3>
            <p>We may share your information with trusted service providers who assist in operating our Service:</p>
            <ul>
              <li><strong>Hosting providers</strong> — Vercel, for application hosting</li>
              <li><strong>Database providers</strong> — For secure data storage (encrypted at rest)</li>
              <li><strong>Authentication services</strong> — NextAuth.js for managing OAuth flows</li>
              <li><strong>Analytics tools</strong> — For anonymized usage analytics (no personally identifiable information shared)</li>
            </ul>
            <p>All service providers are contractually obligated to protect your data and use it only for specified purposes.</p>

            <h3>4.2 Legal Requirements</h3>
            <p>We may disclose your information if required to:</p>
            <ul>
              <li>Comply with legal obligations, court orders, or government requests</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or security threats</li>
              <li>Protect the rights and safety of our users</li>
            </ul>

            <h3>4.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred. 
              We will notify you via email or prominent notice on our Service of any such change in ownership or control.
            </p>

            <h3>4.4 With Your Consent</h3>
            <p>
              We may share your information with third parties when you explicitly consent, such as when scheduling posts 
              to social media platforms (Facebook, Threads, Instagram).
            </p>
          </section>

          <section className="about-section">
            <h2>5. Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul>
              <li><strong>Encryption</strong> — Data is encrypted in transit (HTTPS/TLS) and at rest</li>
              <li><strong>Access Controls</strong> — Strict access controls limit who can view or modify data</li>
              <li><strong>Secure Authentication</strong> — OAuth 2.0 standard for login, JWT for sessions</li>
              <li><strong>Regular Security Audits</strong> — Periodic reviews of security practices and infrastructure</li>
              <li><strong>Database Security</strong> — PostgreSQL with proper indexing and foreign key constraints</li>
            </ul>
            <p>
              <strong>Data Location:</strong> Your data is stored on secure servers. While we take extensive measures to protect your data, 
              no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="about-section">
            <h2>6. Facebook Platform Integration</h2>
            
            <h3>6.1 Facebook Login (OAuth)</h3>
            <p>When you sign in with Facebook, you grant us permission to access:</p>
            <ul>
              <li><strong>Public Profile</strong> — Your name, profile picture, age range, and user ID</li>
              <li><strong>Email Address</strong> — Your email registered with Facebook</li>
            </ul>
            <p>
              We use this information solely for authentication and account management. You can revoke this access at any time 
              through Facebook&apos;s Apps and Websites settings.
            </p>

            <h3>6.2 What We Do NOT Access</h3>
            <p>We do <strong>not</strong> request or access:</p>
            <ul>
              <li>Your Facebook friends list or social graph</li>
              <li>Your Facebook posts, photos, videos, or stories</li>
              <li>Your Facebook messages or conversations</li>
              <li>Your Facebook groups or pages you manage</li>
              <li>Your Facebook activity on other apps or websites</li>
              <li>Any permissions beyond basic profile and email</li>
            </ul>

            <h3>6.3 Content Publishing (Optional)</h3>
            <p>
              If you choose to schedule posts to Facebook, we will request additional permissions at that time. 
              These permissions allow us to publish content on your behalf <strong>only when you explicitly create and schedule a post</strong>.
            </p>

            <h3>6.4 Facebook Platform Terms Compliance</h3>
            <p>
              Our use of Facebook services is governed by:
            </p>
            <ul>
              <li><a href="https://developers.facebook.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>Meta Platform Terms</a></li>
              <li><a href="https://developers.facebook.com/policy" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>Meta Platform Policy</a></li>
              <li><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>Facebook Privacy Policy</a></li>
            </ul>

            <h3>6.5 Data Deletion from Facebook</h3>
            <p>
              Facebook users can request data deletion in two ways:
            </p>
            <ol>
              <li>
                <strong>Through Facebook:</strong> Go to Settings & Privacy → Apps and Websites → Find &quot;Inabiz Online&quot; → 
                Remove → Select &quot;Delete your information from Inabiz Online&quot;
              </li>
              <li>
                <strong>Through our app:</strong> Visit our <Link href="/delete-data" style={{ color: '#00aaff', textDecoration: 'underline' }}>Data Deletion page</Link> 
                for step-by-step instructions
              </li>
            </ol>
            <p>
              We comply with Facebook&apos;s Data Deletion Callback requirements and will delete all your data within 30 days of your request.
            </p>
          </section>

          <section className="about-section">
            <h2>7. Your Rights and Choices</h2>
            
            <h3>7.1 Access Your Data</h3>
            <p>
              You have the right to access the personal data we hold about you. Contact us at 
              <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}> admin@inabiz.online</a> to request a copy.
            </p>

            <h3>7.2 Correct Your Data</h3>
            <p>
              If your personal information is inaccurate or incomplete, you can update it through your account settings 
              or by contacting us.
            </p>

            <h3>7.3 Delete Your Data</h3>
            <p>
              You have the right to request deletion of your personal data at any time. Visit our{' '}
              <Link href="/delete-data" style={{ color: '#00aaff', textDecoration: 'underline' }}>Data Deletion page</Link>{' '}
              for detailed instructions. We will process deletion requests within 30 days.
            </p>

            <h3>7.4 Withdraw Consent</h3>
            <p>
              You can withdraw consent for data processing at any time by:
            </p>
            <ul>
              <li>Disconnecting your Facebook account from your device settings</li>
              <li>Revoking app access through Facebook&apos;s Apps and Websites settings</li>
              <li>Deleting your account through our app or contacting us</li>
            </ul>

            <h3>7.5 Data Portability</h3>
            <p>
              You can export your saved content and scheduled posts at any time using the export features in the app.
            </p>

            <h3>7.6 Opt-Out of Communications</h3>
            <p>
              You can opt out of non-essential communications by contacting us. Note that we may still send you 
              service-related messages (security alerts, account notifications).
            </p>
          </section>

          <section className="about-section">
            <h2>8. Data Retention</h2>
            <p>
              We retain your personal data only as long as necessary to provide our services and fulfill the purposes outlined in this policy:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Saved Content:</strong> Retained until you delete it or close your account</li>
              <li><strong>Scheduled Posts:</strong> Deleted automatically after posting or when you remove them</li>
              <li><strong>Usage Logs:</strong> Anonymized and retained for up to 12 months for analytics</li>
              <li><strong>Legal Records:</strong> May be retained longer if required by law or for legitimate business purposes</li>
            </ul>
            
            <h3>Upon Account Deletion:</h3>
            <ul>
              <li>Personal information deleted within <strong>30 days</strong></li>
              <li>Backup systems purged within <strong>90 days</strong></li>
              <li>Anonymized analytics data may be retained (contains no personally identifiable information)</li>
              <li>Records required for legal compliance may be retained as mandated by law</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>9. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience:
            </p>
            
            <h3>9.1 Essential Cookies</h3>
            <ul>
              <li><strong>Authentication cookies</strong> — Keep you logged in securely</li>
              <li><strong>Session cookies</strong> — Remember your preferences during your visit</li>
            </ul>

            <h3>9.2 Analytics Cookies (Optional)</h3>
            <ul>
              <li><strong>Usage analytics</strong> — Help us understand how you use the app (anonymized)</li>
              <li><strong>Performance monitoring</strong> — Detect and fix technical issues</li>
            </ul>

            <p>
              You can control cookies through your browser settings. Note that disabling essential cookies may affect app functionality.
            </p>
          </section>

          <section className="about-section">
            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for users under the age of 13 (or 16 in the European Economic Area). 
              We do not knowingly collect personal information from children.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information, 
              please contact us at <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a> 
              and we will delete it promptly.
            </p>
          </section>

          <section className="about-section">
            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside of your country. 
              We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy 
              and applicable data protection laws.
            </p>
          </section>

          <section className="about-section">
            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              When we make significant changes:
            </p>
            <ul>
              <li>We will update the &quot;Last updated&quot; date at the top of this policy</li>
              <li>We will notify you via email or prominent notice in the app</li>
              <li>You will be asked to review and accept the updated policy</li>
            </ul>
            <p>
              Continued use of our Service after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="about-section">
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="contact-info-box">
              <p><strong>MASTER SERVE ENTERPRISE</strong></p>
              <p>SSM Registration: TR0276566-V</p>
              <p>📍 Address: V4-25B, Emporis, Jalan Akuatik 13/64, Seksyen 13, 40100 Shah Alam, Selangor, Malaysia</p>
              <p>📧 Email: <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a></p>
              <p>📧 Support: <a href="mailto:support@inabiz.online" style={{ color: '#00aaff' }}>support@inabiz.online</a></p>
            </div>
            <p>
              <strong>Data Protection Officer:</strong> For data protection inquiries, email <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a> 
              with &quot;Data Protection&quot; in the subject line.
            </p>
          </section>

          <section className="about-section">
            <h2>14. Legal Compliance</h2>
            <p>This Privacy Policy is designed to comply with:</p>
            <ul>
              <li>Personal Data Protection Act 2010 (PDPA) - Malaysia</li>
              <li>General Data Protection Regulation (GDPR) - EU</li>
              <li>Meta Platform Terms and Policies</li>
              <li>Other applicable data protection laws</li>
            </ul>
          </section>

          <section className="privacy-section summary-section">
            <h2>Summary of Your Privacy Rights</h2>
            <div className="rights-grid">
              <div className="right-item">
                <div className="right-icon">🔍</div>
                <div className="right-content">
                  <strong>Right to Access</strong>
                  <p>Request a copy of your data</p>
                </div>
              </div>
              <div className="right-item">
                <div className="right-icon">✏️</div>
                <div className="right-content">
                  <strong>Right to Rectify</strong>
                  <p>Correct inaccurate information</p>
                </div>
              </div>
              <div className="right-item">
                <div className="right-icon">🗑️</div>
                <div className="right-content">
                  <strong>Right to Delete</strong>
                  <p>Request data deletion</p>
                </div>
              </div>
              <div className="right-item">
                <div className="right-icon">📦</div>
                <div className="right-content">
                  <strong>Right to Portability</strong>
                  <p>Export your data</p>
                </div>
              </div>
              <div className="right-item">
                <div className="right-icon">🚫</div>
                <div className="right-content">
                  <strong>Right to Withdraw</strong>
                  <p>Revoke consent anytime</p>
                </div>
              </div>
              <div className="right-item">
                <div className="right-icon">📧</div>
                <div className="right-content">
                  <strong>Right to Complain</strong>
                  <p>Contact data protection authority</p>
                </div>
              </div>
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

