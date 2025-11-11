import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <h1>📜 Terms of Service</h1>
          <p className="last-updated">Last updated: November 11, 2025</p>
          <p className="sub-header">
            Inabiz Online (formerly Affiliate Content Genie) - a MASTER SERVE ENTERPRISE service
          </p>
        </header>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              Welcome to <strong>Inabiz Online</strong>, operated by MASTER SERVE ENTERPRISE (SSM: TR0276566-V). 
              By accessing or using our website, application, and services (collectively, the &quot;Service&quot;), 
              you agree to be bound by these Terms of Service (&quot;Terms&quot;).
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Service. Your continued use of the Service 
              constitutes acceptance of these Terms and any future modifications.
            </p>
            <p className="highlight">
              <strong>Important:</strong> These Terms include binding arbitration and class action waiver provisions that affect your legal rights. 
              Please read them carefully.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Description of Service</h2>
            <p>
              Inabiz Online is a content automation and analysis platform that provides:
            </p>
            <ul>
              <li><strong>Content Generation:</strong> AI-powered tools to create video scripts, social media posts, and marketing content</li>
              <li><strong>Product Analysis:</strong> Analysis of product links from e-commerce platforms</li>
              <li><strong>Content Scheduling:</strong> Tools to schedule posts to social media platforms (Facebook, Threads, Instagram)</li>
              <li><strong>Content Management:</strong> Save, organize, and export generated content</li>
              <li><strong>Third-Party Integrations:</strong> Integration with Facebook/Meta, Shopee, and other platforms</li>
            </ul>
            <p>
              The Service is provided for business and personal use in content creation, affiliate marketing, and social media management.
            </p>
          </section>

          <section className="privacy-section">
            <h2>3. Eligibility and Account Registration</h2>
            
            <h3>3.1 Age Requirements</h3>
            <p>
              You must be at least 13 years old (or 16 years old if you are in the European Economic Area) to use this Service. 
              By using the Service, you represent and warrant that you meet this age requirement.
            </p>

            <h3>3.2 Account Creation</h3>
            <p>
              To access certain features, you may need to create an account using:
            </p>
            <ul>
              <li>Facebook Login (OAuth)</li>
              <li>Google Login (OAuth)</li>
              <li>Other supported authentication methods</li>
            </ul>

            <h3>3.3 Account Security</h3>
            <p>
              You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Acceptable Use Policy</h2>
            
            <h3>4.1 Permitted Uses</h3>
            <p>You may use the Service to:</p>
            <ul>
              <li>Create and generate content for legitimate business or personal purposes</li>
              <li>Analyze product information for affiliate marketing</li>
              <li>Schedule and manage social media content</li>
              <li>Export and use content you generate (subject to intellectual property rights)</li>
            </ul>

            <h3>4.2 Prohibited Uses</h3>
            <p>You agree NOT to:</p>
            <ul>
              <li><strong>Violate Laws:</strong> Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li><strong>Infringe Rights:</strong> Upload or generate content that infringes intellectual property, privacy, or other rights of third parties</li>
              <li><strong>Spam or Abuse:</strong> Send spam, phishing attempts, or engage in any form of abuse or harassment</li>
              <li><strong>Reverse Engineering:</strong> Reverse engineer, decompile, or attempt to extract source code from the Service</li>
              <li><strong>Automated Access:</strong> Use bots, scrapers, or automated tools to access the Service without permission</li>
              <li><strong>Impersonation:</strong> Impersonate any person or entity, or misrepresent your affiliation</li>
              <li><strong>Malicious Activity:</strong> Upload viruses, malware, or any code designed to harm the Service or users</li>
              <li><strong>Reselling:</strong> Resell or redistribute the Service without written authorization</li>
              <li><strong>Platform Violations:</strong> Violate the terms of third-party platforms we integrate with (see Section 5)</li>
            </ul>

            <h3>4.3 Content Standards</h3>
            <p>Content you create using the Service must not contain:</p>
            <ul>
              <li>Hate speech, discrimination, or incitement to violence</li>
              <li>Adult content, pornography, or sexually explicit material</li>
              <li>False, misleading, or deceptive claims</li>
              <li>Personal information of others without consent</li>
              <li>Promotion of illegal activities or substances</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>5. Third-Party Platform Compliance</h2>
            
            <h3>5.1 Meta Platform Terms</h3>
            <p>
              When using Facebook Login or publishing content to Facebook, Instagram, or Threads, you agree to comply with:
            </p>
            <ul>
              <li>
                <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>
                  Facebook Terms of Service
                </a>
              </li>
              <li>
                <a href="https://developers.facebook.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>
                  Meta Platform Terms
                </a>
              </li>
              <li>
                <a href="https://developers.facebook.com/policy" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>
                  Meta Platform Policy
                </a>
              </li>
              <li>
                <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>
                  Instagram Community Guidelines
                </a>
              </li>
            </ul>

            <h3>5.2 Your Responsibilities</h3>
            <p>
              When publishing content to third-party platforms through our Service, you are responsible for:
            </p>
            <ul>
              <li>Ensuring content complies with the platform&apos;s terms and policies</li>
              <li>Obtaining necessary rights and permissions for content</li>
              <li>Maintaining appropriate permissions on your social media accounts</li>
              <li>Disclosing affiliate relationships and sponsored content as required by law and platform policies</li>
            </ul>

            <h3>5.3 Platform Changes</h3>
            <p>
              Third-party platforms may change their terms, APIs, or availability at any time. We are not responsible for 
              changes to third-party services that affect the functionality of our Service.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Intellectual Property Rights</h2>
            
            <h3>6.1 Our Intellectual Property</h3>
            <p>
              The Service, including its design, code, features, trademarks (&quot;Inabiz Online&quot;, logos), and original content, 
              is owned by MASTER SERVE ENTERPRISE and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3>6.2 Your Content</h3>
            <p>
              You retain ownership of content you create using the Service. By using the Service, you grant us:
            </p>
            <ul>
              <li>A non-exclusive, worldwide, royalty-free license to store, process, and display your content as necessary to provide the Service</li>
              <li>The right to use anonymized, aggregated data for service improvement and analytics</li>
            </ul>

            <h3>6.3 AI-Generated Content</h3>
            <p>
              Content generated using AI tools may not be protected by copyright in all jurisdictions. You are responsible for 
              reviewing and ensuring compliance with applicable intellectual property laws when using AI-generated content.
            </p>

            <h3>6.4 Third-Party Content</h3>
            <p>
              When analyzing product links or using third-party data:
            </p>
            <ul>
              <li>We fetch publicly available information only</li>
              <li>You must have rights to use any images or content in your generated materials</li>
              <li>Trademarks and copyrights remain with their respective owners</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>7. Payment and Subscription (If Applicable)</h2>
            
            <h3>7.1 Free and Paid Services</h3>
            <p>
              We may offer both free and paid subscription tiers. Pricing, features, and limitations will be clearly displayed 
              on our website or within the app.
            </p>

            <h3>7.2 Billing</h3>
            <ul>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law or stated in our refund policy</li>
              <li>You authorize us to charge your payment method for recurring subscriptions</li>
            </ul>

            <h3>7.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our{' '}
              <Link href="/privacy" style={{ color: '#00aaff', textDecoration: 'underline' }}>Privacy Policy</Link>, 
              which is incorporated into these Terms by reference.
            </p>
            <p>
              Key points:
            </p>
            <ul>
              <li>We collect only necessary information to provide the Service</li>
              <li>We never sell your personal data</li>
              <li>You have rights to access, correct, and delete your data</li>
              <li>See our <Link href="/delete-data" style={{ color: '#00aaff', textDecoration: 'underline' }}>Data Deletion page</Link> for deletion instructions</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>9. Disclaimers and Limitations of Liability</h2>
            
            <h3>9.1 Service &quot;As Is&quot;</h3>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3>9.2 No Guarantee of Results</h3>
            <p>
              We do not guarantee:
            </p>
            <ul>
              <li>Specific results from using the Service</li>
              <li>That AI-generated content will be error-free or suitable for your purpose</li>
              <li>Continuous, uninterrupted, or error-free operation</li>
              <li>That third-party integrations will always function as expected</li>
            </ul>

            <h3>9.3 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MASTER SERVE ENTERPRISE SHALL NOT BE LIABLE FOR:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages arising from your use or inability to use the Service</li>
              <li>Damages arising from content generated using the Service</li>
              <li>Actions or inactions of third-party platforms</li>
            </ul>
            <p>
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, 
              OR RM100 (ONE HUNDRED MALAYSIAN RINGGIT), WHICHEVER IS GREATER.
            </p>

            <h3>9.4 Jurisdictional Limitations</h3>
            <p>
              Some jurisdictions do not allow limitations on implied warranties or exclusion of certain damages. 
              In such jurisdictions, the above limitations may not apply to you.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless MASTER SERVE ENTERPRISE, its officers, directors, employees, 
              and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights, including intellectual property rights</li>
              <li>Content you create, upload, or publish using the Service</li>
              <li>Your violation of applicable laws or regulations</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>11. Termination and Suspension</h2>
            
            <h3>11.1 Termination by You</h3>
            <p>
              You may terminate your account at any time by:
            </p>
            <ul>
              <li>Using the account deletion feature in the app</li>
              <li>Contacting us at <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a></li>
              <li>Following instructions on our <Link href="/delete-data" style={{ color: '#00aaff', textDecoration: 'underline' }}>Data Deletion page</Link></li>
            </ul>

            <h3>11.2 Termination by Us</h3>
            <p>
              We may suspend or terminate your access immediately, without notice, for:
            </p>
            <ul>
              <li>Violation of these Terms</li>
              <li>Violation of third-party platform terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of fees (for paid accounts)</li>
              <li>Extended inactivity</li>
              <li>Legal or regulatory requirements</li>
            </ul>

            <h3>11.3 Effect of Termination</h3>
            <p>
              Upon termination:
            </p>
            <ul>
              <li>Your right to use the Service immediately ceases</li>
              <li>Your data will be deleted within 30 days (see Privacy Policy)</li>
              <li>Provisions that should survive termination (liability limitations, indemnification) remain in effect</li>
              <li>No refunds will be provided for prepaid services (except as required by law)</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes:
            </p>
            <ul>
              <li>We will update the &quot;Last updated&quot; date</li>
              <li>We will notify you via email or prominent notice in the app</li>
              <li>Continued use after changes constitutes acceptance of the new Terms</li>
              <li>If you do not agree to the changes, you must stop using the Service</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>13. Governing Law and Dispute Resolution</h2>
            
            <h3>13.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of Malaysia, without regard to conflict of law principles.
            </p>

            <h3>13.2 Jurisdiction</h3>
            <p>
              Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the 
              courts in Shah Alam, Selangor, Malaysia.
            </p>

            <h3>13.3 Dispute Resolution Process</h3>
            <p>
              Before filing a lawsuit, you agree to:
            </p>
            <ol>
              <li>Contact us at <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a> to attempt informal resolution</li>
              <li>Provide a detailed description of the dispute</li>
              <li>Allow 30 days for us to respond and attempt resolution</li>
            </ol>
          </section>

          <section className="privacy-section">
            <h2>14. Miscellaneous</h2>
            
            <h3>14.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and MASTER SERVE ENTERPRISE 
              regarding the Service.
            </p>

            <h3>14.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force.
            </p>

            <h3>14.3 Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>

            <h3>14.4 Assignment</h3>
            <p>
              You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3>14.5 Force Majeure</h3>
            <p>
              We shall not be liable for any failure to perform due to circumstances beyond our reasonable control, including natural disasters, 
              war, terrorism, labor disputes, or internet service provider failures.
            </p>
          </section>

          <section className="privacy-section">
            <h2>15. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact:
            </p>
            <div className="contact-info-box">
              <p><strong>MASTER SERVE ENTERPRISE</strong></p>
              <p>SSM Registration: TR0276566-V</p>
              <p>📍 <strong>Address:</strong> V4-25B, Emporis, Jalan Akuatik 13/64, Seksyen 13, 40100 Shah Alam, Selangor, Malaysia</p>
              <p>📧 <strong>Email:</strong> <a href="mailto:admin@inabiz.online" style={{ color: '#00aaff' }}>admin@inabiz.online</a></p>
              <p>📧 <strong>Support:</strong> <a href="mailto:support@inabiz.online" style={{ color: '#00aaff' }}>support@inabiz.online</a></p>
              <p>📞 <strong>Phone:</strong> <a href="tel:+60145143981" style={{ color: '#00aaff' }}>+60 14-514 3981</a></p>
            </div>
            <p>
              <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM MYT
            </p>
          </section>

          <section className="privacy-section summary-section">
            <h2>📋 Quick Reference Summary</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-icon">✅</div>
                <div className="summary-content">
                  <strong>What You Can Do</strong>
                  <p>Create content, analyze products, schedule posts, export your data</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">🚫</div>
                <div className="summary-content">
                  <strong>What&apos;s Prohibited</strong>
                  <p>Illegal activity, spam, reverse engineering, platform violations</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">🔗</div>
                <div className="summary-content">
                  <strong>Third-Party Terms</strong>
                  <p>Must comply with Meta, Facebook, Instagram platform policies</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">💼</div>
                <div className="summary-content">
                  <strong>Your Responsibility</strong>
                  <p>Secure your account, ensure content compliance, proper disclosures</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">⚖️</div>
                <div className="summary-content">
                  <strong>Liability Limits</strong>
                  <p>Service &quot;as is&quot;, limited liability, indemnification required</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">📞</div>
                <div className="summary-content">
                  <strong>Questions?</strong>
                  <p>Contact admin@inabiz.online for assistance</p>
                </div>
              </div>
            </div>
          </section>

          <div className="acknowledgment-box">
            <p>
              <strong>⚠️ BY USING INABIZ ONLINE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.</strong>
            </p>
          </div>
        </div>

        <footer className="privacy-footer">
          <div className="footer-links-grid">
            <Link href="/" className="back-link">← Back to Home</Link>
            <Link href="/privacy" className="back-link">🛡️ Privacy Policy</Link>
            <Link href="/delete-data" className="back-link">🗑️ Delete My Data</Link>
            <Link href="/contact" className="back-link">📧 Contact Us</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .sub-header {
          font-size: 0.9rem;
          color: var(--secondary-text-color);
          margin-top: 0.5rem;
        }

        h3 {
          font-size: 1.1rem;
          color: var(--primary-text-color);
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .contact-info-box {
          background: rgba(255, 123, 0, 0.05);
          border: 1px solid rgba(255, 123, 0, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-info-box p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .summary-section {
          background: linear-gradient(135deg, rgba(255, 123, 0, 0.05), rgba(0, 170, 255, 0.05));
          border: 2px solid rgba(255, 123, 0, 0.2);
          border-radius: 16px;
          padding: 2rem;
          margin-top: 2rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .summary-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          background: rgba(13, 15, 27, 0.6);
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .summary-item:hover {
          border-color: rgba(255, 123, 0, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 123, 0, 0.2);
        }

        .summary-icon {
          font-size: 2rem;
          min-width: 2.5rem;
        }

        .summary-content strong {
          display: block;
          color: var(--primary-text-color);
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .summary-content p {
          font-size: 0.9rem;
          color: var(--secondary-text-color);
          margin: 0;
          line-height: 1.5;
        }

        .acknowledgment-box {
          background: rgba(255, 123, 0, 0.1);
          border: 2px solid rgba(255, 123, 0, 0.4);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0 1rem;
          text-align: center;
        }

        .acknowledgment-box p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .footer-links-grid {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .summary-section {
            padding: 1.5rem;
          }

          .summary-item {
            padding: 1rem;
          }

          .acknowledgment-box {
            padding: 1.25rem;
          }

          .footer-links-grid {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
