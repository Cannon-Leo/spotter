'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function CreateAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('That code is not valid. Ask the front desk for a new one.');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      setError('PIN must be exactly 4 numeric digits.');
      return;
    }

    if (!acceptedPrivacy) {
      setError('Please accept the member privacy notice to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'That code is not valid. Ask the front desk for a new one.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred during account activation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.authPageRoot}>
      <div className={styles.authContainer}>
        {/* Top bar */}
        <div className={styles.authTopBar}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to Spotter
          </Link>
          <span className={styles.topBarBadge}>Official Member App</span>
        </div>

        {/* Create Account Card */}
        <div className={styles.authCard}>
          <div className={styles.cardBody}>
            <div className={styles.brandLogoBox} aria-label="Spotter Logo">
              SPOTTER
            </div>

            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Create Member Account</h1>
              <p className={styles.cardSubtitle}>
                Enter the 8-character activation code issued by the front desk.
              </p>
            </div>

            <div className={styles.divider} />

            {error && (
              <div className={styles.errorBanner} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleActivate} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="accountEmail" className={styles.formLabel}>
                  Email Address
                </label>
                <input
                  id="accountEmail"
                  name="email"
                  type="email"
                  placeholder="chioma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.formInput}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="activationCode" className={styles.formLabel}>
                  8-Character Activation Code
                </label>
                <input
                  id="activationCode"
                  name="code"
                  type="text"
                  maxLength={10}
                  placeholder="e.g. SPT4X9KL"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={styles.formInput}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountPin" className={styles.formLabel}>
                  Choose 4-Digit Security PIN
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="accountPin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className={styles.passwordInput}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className={styles.showHideBtn}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <label className={styles.privacyCheck}>
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  required
                  style={{ marginTop: '3px' }}
                />
                <span>I accept the Spotter member privacy notice and terms of record access (FR-58).</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Tinted Bottom Bar */}
          <div className={styles.cardFooter}>
            Already a member?{' '}
            <Link href="/login" className={styles.footerLink}>
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

