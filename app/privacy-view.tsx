'use client';

import React from 'react';
import ThemeToggle from './theme-toggle';
import styles from './legal.module.css';
import SpotterLogo from './spotter-logo';

interface PrivacyViewProps {
  onBack: () => void;
}

export default function PrivacyView({ onBack }: PrivacyViewProps) {
  return (
    <div className={styles.legalPageRoot}>
      {/* Top Header Navigation */}
      <nav className={styles.legalTopNav} aria-label="Privacy view navigation">
        <button
          type="button"
          onClick={onBack}
          className={styles.backHomeBtn}
          aria-label="Return to Spotter Home"
        >
          <SpotterLogo size={28} />
          <span>&larr; Return to Spotter</span>
        </button>
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
              <span>Nigeria Data Protection Act (NDPA) 2023 Compliant</span>
            </span>
          </div>

          <h1 className={styles.documentTitle}>Member Privacy Notice</h1>

          <div className={styles.documentMeta}>
            <span className={styles.metaItem}>
              <strong>Governing Law:</strong> Nigeria Data Protection Act 2023 (NDPA) &amp; NDPR
            </span>
            <span className={styles.metaItem}>
              <strong>Effective Date:</strong> October 2026
            </span>
            <span className={styles.metaItem}>
              <strong>Version:</strong> 2.0 (Plain English)
            </span>
          </div>

          {/* Privacy Callout */}
          <div className={styles.calloutCard}>
            <p className={styles.calloutText}>
              <strong className={styles.calloutHighlight}>Private by design.</strong>{' '}
              Your records are accessed only by your session member ID. Never embedded, never searched across other members, and no push notifications or marketing spam.
            </p>
          </div>

          {/* Detailed Policy Content */}
          <div className={styles.contentBody}>
            {/* Section 1 */}
            <section className={styles.sectionBlock} id="data-controller">
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>1.</span> Data Controller &amp; Data Processor Designation
              </h2>
              <p className={styles.paragraph}>
                In compliance with Part V and Section 65 of the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>The Gym is the Data Controller.</strong> The gym determines the purposes and lawful means of processing your gym membership, attendance, and billing records.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Spotter (the developer platform) is the Data Processor.</strong> Spotter processes data strictly upon the verified instructions of the gym and maintains technical and organizational measures to safeguard your information.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>2.</span> What Data We Collect
              </h2>
              <p className={styles.paragraph}>
                We collect only the minimum data required to deliver your gym membership services (NDPA Section 24(1)(b)):
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Member Identity:</strong> Your full name, registered phone number (WhatsApp number), member ID, and membership tier (Basic or Premium).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Authentication Security PIN:</strong> A 4-digit PIN chosen by you. We store this exclusively as an <strong>Argon2id cryptographic hash</strong> (a computationally intensive hashing algorithm). Your plain PIN is never stored, never logged, and cannot be viewed by gym staff or developers (PRD FR-3).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Attendance Check-In Records:</strong> Date and timestamps of your visits recorded when you enter the daily check-in code at the facility or when staff record an in-person manual check-in (PRD F-3).
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Payments &amp; Financial Ledger:</strong> Transaction references, renewal dates, payment gateway timestamps, and your membership balance ledger entries.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Audit &amp; Access Logs:</strong> Logs of questions asked and data access records to verify that every answer points strictly to an approved source and that your private records are never accessed by unauthorized parties (PRD G-5, 8.5).
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>3.</span> Data We Never Collect
              </h2>
              <p className={styles.paragraph}>
                To protect member confidentiality and uphold data minimization:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Health or Medical Data:</strong> We do not ask for or store medical diagnoses, health histories, or injury records.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Body Metrics:</strong> We do not track weight logs, body measurements, or fitness vanity metrics.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Biometrics:</strong> We do not store fingerprint or facial recognition data.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Background Location Tracking:</strong> We never track your GPS coordinates in the background. Check-in is validated by a 4-digit code provided inside the gym during opening hours.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>4.</span> Strict Isolation &amp; Zero Marketing Spam
              </h2>
              <p className={styles.paragraph}>
                Spotter is built with architectural privacy constraints:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Session Member Scoping:</strong> Every query for private records filters strictly by your verified session member ID. Member IDs supplied in request bodies are ignored.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Never Shared or Vectorized:</strong> Your private records are never embedded into shared vector databases or searched across other gym members.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Zero Push Notifications:</strong> Spotter never initiates contact with you first. We send zero marketing emails, push notifications, attendance nudges, or promotional WhatsApp spam. Every piece of information shown in Spotter is something you opened the app to see.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>No Public Model Training:</strong> Member records are never shared with third parties to train commercial AI foundation models.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className={styles.sectionBlock} id="retention">
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>5.</span> Statutory Data Retention &amp; Disposal
              </h2>
              <p className={styles.paragraph}>
                In accordance with NDPA Section 24(1)(d) and statutory accounting standards, data is retained strictly on this fixed schedule:
              </p>
              <div className={styles.tableContainer}>
                <table className={styles.legalTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Record Type</th>
                      <th className={styles.tableHeader}>Retention Period</th>
                      <th className={styles.tableHeader}>Legal / Operational Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.tableCell}><strong>Attendance Logs</strong></td>
                      <td className={styles.tableCell}>24 months</td>
                      <td className={styles.tableCell}>Member visit verification and audit (PRD FR-60)</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Question &amp; Access Logs</strong></td>
                      <td className={styles.tableCell}>24 months</td>
                      <td className={styles.tableCell}>Audit trail and answer grounding verification (PRD FR-60)</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Member Identity &amp; Profile</strong></td>
                      <td className={styles.tableCell}>Duration of membership + 24 months</td>
                      <td className={styles.tableCell}>Re-activation and membership dispute resolution</td>
                    </tr>
                    <tr>
                      <td className={styles.tableCell}><strong>Payment Records &amp; Receipts</strong></td>
                      <td className={styles.tableCell}>7 years</td>
                      <td className={styles.tableCell}>Statutory Nigerian financial and tax compliance (CAMA / FIRS)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.paragraph}>
                <strong>Gym Exit Policy (PRD FR-61):</strong> If the gym terminates its platform contract, the gym owner receives a full CSV export of all records within 14 days, and all member data is permanently deleted from the processor&apos;s servers within 30 days of export confirmation.
              </p>
            </section>

            {/* Section 6 */}
            <section className={styles.sectionBlock} id="member-rights">
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>6.</span> Your Rights Under Nigerian Law
              </h2>
              <p className={styles.paragraph}>
                Under Part VI (Sections 34&ndash;38) of the <strong>Nigeria Data Protection Act 2023</strong>, you have the following enforceable rights:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Right of Access:</strong> You can view your check-in counts, membership status, and payment receipts directly in Spotter at any time.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Right to Rectification:</strong> You may request corrections to your name or contact details by contacting the front desk.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Right to Erasure:</strong> You can request deletion of your personal records upon terminating your membership, subject to the statutory 7-year retention period for financial accounting.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Right to Data Portability:</strong> You may request an export of your attendance and payment records.
                </li>
                <li className={styles.bulletItem}>
                  <strong className={styles.boldText}>Right to Lodge a Complaint:</strong> If you believe your data has been handled inconsistently with Nigerian law, you may lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)', textDecoration: 'underline' }}>ndpc.gov.ng</a>.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>7.</span> Contacting the Front Desk
              </h2>
              <p className={styles.paragraph}>
                To exercise any of your data protection rights or report a privacy concern, speak with the front desk officer on duty during gym hours or send a message via WhatsApp.
              </p>
              <div className={styles.actionRow}>
                <a
                  href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20have%20a%20privacy%20or%20data%20request%20regarding%20my%20Spotter%20account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryActionBtn}
                >
                  Message Front Desk on WhatsApp &rarr;
                </a>
                <button type="button" onClick={onBack} className={styles.secondaryActionBtn}>
                  Return to Overview
                </button>
              </div>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
