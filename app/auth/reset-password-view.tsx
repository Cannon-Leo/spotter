import React from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import SpotterLogo from '../spotter-logo';

export default function ResetPasswordView() {
  return (
    <div className={styles.authCard}>
      <div className={styles.cardHeader}>
        <div className={styles.logoRow}>
          <SpotterLogo size={32} />
          <span className={styles.brandTitle}>Spotter</span>
        </div>
        <h1 className={styles.cardTitle}>Reset Your 4-Digit Security PIN</h1>
        <p className={styles.cardSubtitle}>
          Spotter hashes your security PIN using Argon2id cryptographic encryption. For your protection, old PINs cannot be recovered or read by anyone.
        </p>
      </div>

      <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-outline-variant)',
            borderLeft: '3px solid var(--color-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
            fontSize: 'var(--typography-body-small-font-size)',
            lineHeight: 1.6,
            color: 'var(--color-on-background)',
          }}
        >
          <strong style={{ color: 'var(--color-secondary)' }}>How PIN Resets Work:</strong>
          <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
            <li>Contact the front desk officer on duty either in person or via WhatsApp.</li>
            <li>The officer will issue a secure one-time activation code to your registered WhatsApp number.</li>
            <li>Enter the activation code on the activation screen to set a new 4-digit PIN.</li>
          </ol>
        </div>

        <a
          href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20need%20a%20PIN%20reset%20code%20for%20my%20Spotter%20account"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.submitBtn}
          style={{
            textAlign: 'center',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          Request Reset Code on WhatsApp &rarr;
        </a>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/auth?view=create-account"
            className={styles.footerLink}
            style={{ fontWeight: 600, fontSize: 'var(--typography-body-medium-font-size)' }}
          >
            Already have an activation code? Enter it here &rarr;
          </Link>
        </div>
      </div>

      {/* Footer bar */}
      <div className={styles.cardFooter}>
        Remembered your PIN?{' '}
        <Link href="/auth?view=login" className={styles.footerLink}>
          Log in to your account
        </Link>
      </div>
    </div>
  );
}
