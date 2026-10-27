'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { getOrCreateDeviceId } from './view';

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

const PIN_PATTERN = /^\d{4}$/;

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ identifier: false, pin: false });

  const identifierRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const identifierEmpty = touched.identifier && !identifier.trim();
  const pinEmpty = touched.pin && !pin.trim();
  const pinInvalid = touched.pin && Boolean(pin.trim()) && !PIN_PATTERN.test(pin.trim());

  function markTouched(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setTouched((prev) => ({ ...prev, identifier: true }));
      identifierRef.current?.focus();
      setError('Please enter your member number or email address.');
      return;
    }

    if (!PIN_PATTERN.test(pin.trim())) {
      setTouched((prev) => ({ ...prev, pin: true }));
      pinRef.current?.focus();
      setError('Please enter your four digit PIN.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin: pin.trim(),
          deviceId: getOrCreateDeviceId(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Those details do not match our records.');
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
            <label htmlFor="loginIdentifier" className={styles.formLabel}>
              Member Number or Email
            </label>
            <input
              id="loginIdentifier"
              name="identifier"
              type="text"
              placeholder="123456 or chioma@example.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError('');
              }}
              onBlur={() => markTouched('identifier')}
              ref={identifierRef}
              className={`${styles.formInput} ${identifierEmpty ? styles.inputInvalid : ''}`}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              aria-invalid={identifierEmpty}
              aria-describedby={identifierEmpty ? 'loginIdentifierError' : undefined}
            />
            {identifierEmpty && (
              <span id="loginIdentifierError" className={styles.fieldError} role="alert">
                <CautionIcon /> This field must not be empty
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="loginPin" className={styles.formLabel}>
                4-digit PIN
              </label>
              <a
                href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20need%20a%20PIN%20reset%20for%20my%20Spotter%20account"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.forgotLink}
              >
                Forgot PIN?
              </a>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="loginPin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (error) setError('');
                }}
                onBlur={() => markTouched('pin')}
                ref={pinRef}
                className={`${styles.passwordInput} ${pinEmpty || pinInvalid ? styles.inputInvalid : ''}`}
                autoComplete="current-password"
                required
                aria-invalid={pinEmpty || pinInvalid}
                aria-describedby={pinEmpty ? 'loginPinError' : undefined}
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
            {pinEmpty && (
              <span id="loginPinError" className={styles.fieldError} role="alert">
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
          Activate your account
        </Link>
      </div>
    </div>
  );
}
