'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address or member ID.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your 4-digit security PIN.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to sign in. Please verify your credentials.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
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

        {/* Login Card */}
        <div className={styles.authCard}>
          <div className={styles.cardBody}>
            <div className={styles.brandLogoBox} aria-label="Spotter Logo">
              SPOTTER
            </div>

            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Member Log In</h1>
              <p className={styles.cardSubtitle}>
                Access your gym check-in code, attendance records, and balance.
              </p>
            </div>

            <div className={styles.divider} />

            {error && (
              <div className={styles.errorBanner} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="loginEmail" className={styles.formLabel}>
                  Email Address
                </label>
                <input
                  id="loginEmail"
                  name="email"
                  type="email"
                  placeholder="chioma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.formInput}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="loginPassword" className={styles.formLabel}>
                    Password / PIN
                  </label>
                  <a
                    href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20need%20a%20PIN%20reset%20for%20my%20Spotter%20account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.forgotLink}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    id="loginPassword"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter 4-digit PIN"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.passwordInput}
                    autoComplete="current-password"
                    maxLength={10}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.showHideBtn}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? 'Signing in...' : 'Log In'}
              </button>
            </form>
          </div>

          {/* Tinted Bottom Bar */}
          <div className={styles.cardFooter}>
            New to Spotter?{' '}
            <Link href="/create-account" className={styles.footerLink}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

