'use client';

import React from 'react';
import Link from 'next/link';
import styles from './footer.module.css';
import SpotterLogo from './spotter-logo';

interface FooterProps {
  onSelectView?: (view: 'privacy' | 'terms') => void;
}

export default function Footer({ onSelectView }: FooterProps) {
  const handlePrivacyClick = (e: React.MouseEvent) => {
    if (onSelectView) {
      e.preventDefault();
      onSelectView('privacy');
    }
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    if (onSelectView) {
      e.preventDefault();
      onSelectView('terms');
    }
  };

  return (
    <footer className={styles.footerRoot}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* Column 1: Brand & Compliance */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brandLogoRow}>
              <SpotterLogo size={32} />
              <span className={styles.brandName}>Spotter</span>
            </Link>
            <p className={styles.brandDesc}>
              The member-facing web app for a single gym. Check in, view personal attendance and balance, and pay subscriptions instantly.
            </p>
            <div className={styles.complianceBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>NDPA 2023 Compliant</span>
            </div>
          </div>

          {/* Column 2: Member Navigation */}
          <div>
            <h3 className={styles.colTitle}>Member Access</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/login" className={styles.footerLink}>
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/create-account" className={styles.footerLink}>
                  Get Started / Activate
                </Link>
              </li>
              <li>
                <Link href="/reset-password" className={styles.footerLink}>
                  Reset Password / PIN
                </Link>
              </li>
              <li>
                <Link href="/login?redirect=check-in" className={styles.footerLink}>
                  Daily Check-In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Governance (Conditional Views on Home) */}
          <div>
            <h3 className={styles.colTitle}>Legal & Privacy</h3>
            <ul className={styles.linkList}>
              <li>
                <a
                  href="/?view=privacy"
                  onClick={handlePrivacyClick}
                  className={styles.footerLink}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/?view=terms"
                  onClick={handleTermsClick}
                  className={styles.footerLink}
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/?view=privacy#data-controller"
                  onClick={handlePrivacyClick}
                  className={styles.footerLink}
                >
                  Data Controller Notice
                </a>
              </li>
              <li>
                <a
                  href="/?view=privacy#member-rights"
                  onClick={handlePrivacyClick}
                  className={styles.footerLink}
                >
                  Your Data Rights
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Front Desk Support */}
          <div>
            <h3 className={styles.colTitle}>Front Desk</h3>
            <p className={styles.infoNote}>
              In-person at the desk during opening hours, or message the duty officer.
            </p>
            <ul className={styles.linkList}>
              <li>
                <a
                  href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20have%20a%20question%20about%20my%20Spotter%20account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  Ask Desk on WhatsApp &rarr;
                </a>
              </li>
              <li>
                <span className={styles.infoNote}>
                  Mon &ndash; Sat: 6:00 AM &ndash; 9:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Direct Legal Links */}
        <div className={styles.footerBottom}>
          <p className={styles.copyrightText}>
            &copy; {new Date().getFullYear()} Spotter. Built for single gym member independence. Operating under Nigerian law.
          </p>
          <div className={styles.bottomLinks}>
            <a
              href="/?view=privacy"
              onClick={handlePrivacyClick}
              className={styles.footerLink}
            >
              Privacy Policy
            </a>
            <span aria-hidden="true">&bull;</span>
            <a
              href="/?view=terms"
              onClick={handleTermsClick}
              className={styles.footerLink}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
