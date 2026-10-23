'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

function CautionIcon() {
  return (
    <svg
      className={styles.fieldErrorIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailEmpty = touched.email && !email.trim();
  const passwordEmpty = touched.password && !password.trim();

  function markTouched(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setTouched((prev) => ({ ...prev, email: true }));
      setError('Please enter your email address or member ID.');
      return;
    }

    if (!password.trim()) {
      setTouched((prev) => ({ ...prev, password: true }));
      setError('Please enter your password.');
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
              onBlur={() => markTouched('email')}
              className={`${styles.formInput} ${emailEmpty ? styles.inputInvalid : ''}`}
              autoComplete="email"
              autoFocus
              required
              aria-invalid={emailEmpty}
              aria-describedby={emailEmpty ? 'loginEmailError' : undefined}
            />
            {emailEmpty && (
              <span id="loginEmailError" className={styles.fieldError} role="alert">
                <CautionIcon /> This field must not be empty
              </span>
            )}
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
                onBlur={() => markTouched('password')}
                className={`${styles.passwordInput} ${passwordEmpty ? styles.inputInvalid : ''}`}
                autoComplete="current-password"
                maxLength={10}
                required
                aria-invalid={passwordEmpty}
                aria-describedby={passwordEmpty ? 'loginPasswordError' : undefined}
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
            {passwordEmpty && (
              <span id="loginPasswordError" className={styles.fieldError} role="alert">
                <CautionIcon /> This field must not be empty
              </span>
            )}
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
        <Link href="/auth?view=create-account" className={styles.footerLink}>
          Create an account
        </Link>
      </div>
    </div>
  );
}
