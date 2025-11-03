import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <h1>📜 Terms of Service</h1>
          <p className="last-updated">Last updated: November 2025</p>
        </header>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By using Affiliate Content Genie (the &quot;Service&quot;), you agree to these Terms. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Description of Service</h2>
            <p>
              Affiliate Content Genie is a content automation and analysis tool that helps users plan, generate, and schedule affiliate or social content. Some features integrate with third-party APIs (e.g., Facebook, Shopee, Threads).
            </p>
          </section>

          <section className="privacy-section">
            <h2>3. Use of Service</h2>
            <p>
              You agree to use the Service only for lawful purposes and in accordance with all applicable laws and platform policies (e.g., Meta Platform Terms).
            </p>
            <p>You may not:</p>
            <ul>
              <li>Reverse-engineer or resell the Service.</li>
              <li>Attempt to scrape or collect unauthorized data from external platforms.</li>
              <li>Misuse OAuth logins to impersonate others.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Account and Access</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials. We reserve the right to suspend access if misuse is detected.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Intellectual Property</h2>
            <p>
              All rights to the Service and its original content (excluding third-party data) belong to Affiliate Content Genie.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is.&quot; We are not liable for any indirect, incidental, or consequential damages arising from use of the Service.
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these Terms or applicable laws.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Contact Us</h2>
            <p>If you have any questions:</p>
            <p className="contact-email">
              📧 <a href="mailto:support@inabiz.online">support@inabiz.online</a>
            </p>
            <p className="contact-email">
              📧 <a href="mailto:admin@inabiz.online">admin@inabiz.online</a>
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
