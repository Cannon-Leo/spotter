import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeToggle from '../theme-toggle';
import Footer from '../footer';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Spotter Member Terms of Service governed under the laws of the Federal Republic of Nigeria.',
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.legalPageRoot}>
      {/* Top Header Navigation */}
      <nav className={styles.legalTopNav} aria-label="Terms page navigation">
        <Link href="/" className={styles.backHomeLink} aria-label="Return to Spotter Home">
          <span className={styles.brandLogoSquare} aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </span>
          <span>&larr; Return to Spotter</span>
        </Link>
        <div className={styles.navRight}>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Legal Content */}
      <main className={styles.legalMain}>
        <article className={styles.legalCard}>
          {/* Header Info */}
          <div className={styles.badgeRow}>
            <span className={styles.compliancePill}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Governed by Nigerian Law</span>
            </span>
          </div>

          <h1 className={styles.documentTitle}>Terms of Service</h1>

          <div className={styles.documentMeta}>
            <span className={styles.metaItem}>
              <strong>Jurisdiction:</strong> Federal Republic of Nigeria
            </span>
            <span className={styles.metaItem}>
              <strong>Effective Date:</strong> October 2026
            </span>
            <span className={styles.metaItem}>
              <strong>Applicability:</strong> Spotter Gym Members
            </span>
          </div>

          {/* Core Philosophy Callout */}
          <div className={styles.calloutCard}>
            <p className={styles.calloutText}>
              <strong className={styles.calloutHighlight}>Built for member independence.</strong>{' '}
              Spotter lets you check in, review your own attendance and balance, pay your subscription with immediate automatic extension, and get verified answers drawn strictly from approved gym records.
            </p>
          </div>

          {/* Detailed Terms */}
          <div className={styles.contentBody}>
            {/* Section 1 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>1.</span> Scope &amp; Eligibility
              </h2>
              <p className={styles.paragraph}>
                Spotter is a dedicated web application provided by the gym for its registered members. By activating an account, setting a security PIN, or accessing Spotter, you agree to these Terms of Service.
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Member Requirement:</strong> Spotter is available exclusively to individuals with an active or registered membership with the gym.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Activation:</strong> Activation requires a one-time activation code issued in-person or remotely to your registered WhatsApp number by the gym front desk (PRD FR-3).
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>2.</span> Account Security &amp; 4-Digit PIN
              </h2>
              <p className={styles.paragraph}>
                You authenticate your Spotter account using your phone number or email and a 4-digit security PIN:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Argon2id Hashing:</strong> Your PIN is stored as an Argon2id hash. Plaintext PINs are never stored or logged anywhere on our systems.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Confidentiality:</strong> You are responsible for keeping your PIN confidential. Do not share your PIN with anyone.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>PIN Resets:</strong> Because staff cannot read your hashed PIN, PIN resets require a fresh activation code issued by the front desk officer upon identity confirmation.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>3.</span> Facility Check-In Rules
              </h2>
              <p className={styles.paragraph}>
                Spotter makes attendance a recorded fact. Check-ins are governed by the following rules (PRD F-3, FR-19):
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Physical Presence:</strong> Check-ins are completed by entering the 4-digit daily code posted on the whiteboard at the gym front desk.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Operating Hours:</strong> Check-ins are accepted strictly between the gym&apos;s scheduled opening and closing hours. Off-hours attempts are automatically refused (PRD FR-19b).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Remote Check-Ins:</strong> Photographing or broadcasting the daily code for members who are not physically present inside the facility is prohibited.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Manual Check-Ins for Dead Phones:</strong> If your device battery is dead or you encounter network failure, front desk officers may log an in-person manual check-in with staff identity logging (PRD FR-22).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Grace Period &amp; Expired Status:</strong> Check-in is blocked for accounts expired past the grace period. In such cases, the screen presents your renewal options (PRD FR-23b).
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>4.</span> Subscriptions, Payments &amp; Automatic Extension
              </h2>
              <p className={styles.paragraph}>
                Spotter allows members to pay dues and subscription renewals seamlessly (PRD F-4):
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Instant Automated Extension:</strong> When an online payment is confirmed by a verified server-side webhook, your membership is extended automatically with zero staff action required (PRD FR-24). Browser redirects are never treated as proof of payment.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Idempotent Charging:</strong> Repeated taps or connection drops return the existing payment attempt and never charge your bank card twice (PRD FR-26).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Access to History:</strong> If your membership expires, you retain full access to your attendance history, payment receipts, price lists, and renewal options (PRD FR-53b).
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>5.</span> Answering System &amp; Never-Answer List
              </h2>
              <p className={styles.paragraph}>
                Spotter answers your questions using only the gym&apos;s own approved records. If the records hold no answer, or the inquiry touches a sensitive category, Spotter refuses politely and hands you directly to the duty front desk officer (PRD 7.3, FR-35):
              </p>
              <div className={styles.tableContainer}>
                <table className={styles.legalTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Never-Answer Category (FR-35)</th>
                      <th className={styles.tableHeader}>System Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.tableCell}><strong>Another member&apos;s information</strong></td>
                      <td className={styles.tableCell}>Immediate refusal; private records are isolated to your own session.</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Medical, clinical, or diet diagnosis</strong></td>
                      <td className={styles.tableCell}>Immediate refusal; Spotter does not provide medical or injury advice.</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Door access or electronic bypass</strong></td>
                      <td className={styles.tableCell}>Immediate refusal; security and access rules remain physical.</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Refunds, waivers, or cancellation decisions</strong></td>
                      <td className={styles.tableCell}>Immediate refusal; only gym management can authorize financial exceptions.</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Staff conduct complaints</strong></td>
                      <td className={styles.tableCell}>Immediate refusal; handed directly to management.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>6.</span> Governing Law &amp; Dispute Resolution
              </h2>
              <p className={styles.paragraph}>
                These Terms of Service are governed by and construed in accordance with the <strong>laws of the Federal Republic of Nigeria</strong>.
              </p>
              <p className={styles.paragraph}>
                Any question, discrepancy in attendance, or ledger dispute should first be raised with the gym front desk officer or gym management. If an amicable settlement cannot be reached, disputes shall be subject to the jurisdiction of the competent courts of the Federal Republic of Nigeria.
              </p>
              <div className={styles.actionRow}>
                <a
                  href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20have%20an%20inquiry%20regarding%20the%20Spotter%20Terms%20of%20Service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryActionBtn}
                >
                  Contact Desk Officer on WhatsApp &rarr;
                </a>
                <Link href="/" className={styles.secondaryActionBtn}>
                  Return to Home
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
