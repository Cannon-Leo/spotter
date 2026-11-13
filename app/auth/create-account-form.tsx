'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { formatEmailInput, formatPinInput, getOrCreateDeviceId } from './view';

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ACTIVATION_CODE_PATTERN = /^[A-Z0-9]{8}$/;
const PIN_PATTERN = /^\d{4}$/;

function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address';
  return '';
}

function validateActivationCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (!ACTIVATION_CODE_PATTERN.test(trimmed)) {
    return 'Activation codes are exactly 8 letters or digits';
  }
  return '';
}

function validatePin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (!PIN_PATTERN.test(trimmed)) return 'Your PIN must be exactly four digits';
  return '';
}

export default function CreateAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [termsWarning, setTermsWarning] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    code: false,
    pin: false,
  });

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const emailStarted = touched.email || email.trim().length > 0;
  const emailError = emailStarted ? validateEmail(email) : '';
  const codeError = touched.code ? validateActivationCode(code) : '';
  const pinTrimmed = pin.trim();
  const pinError = touched.pin
    ? !pinTrimmed
      ? 'This field must not be empty'
      : !PIN_PATTERN.test(pinTrimmed)
        ? 'Your PIN must be exactly four digits'
        : ''
    : '';
  const pinHintVisible = pin.length > 0 && !pinError;
  const pinDescribedBy = pinError ? 'accountPinError' : 'accountPinHint';
  const termsInvalid = termsWarning && !acceptedPrivacy;
  const isFormValid =
    !validateEmail(email) &&
    !validateActivationCode(code) &&
    PIN_PATTERN.test(pinTrimmed) &&
    acceptedPrivacy;

  const unmetRequirements: string[] = [];
  if (validateEmail(email)) unmetRequirements.push('a valid email address');
  if (validateActivationCode(code)) unmetRequirements.push('the 8 character activation code');
  if (!PIN_PATTERN.test(pinTrimmed)) unmetRequirements.push('a 4 digit PIN');
  if (!acceptedPrivacy) unmetRequirements.push('acceptance of the terms and conditions');

  function markTouched(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let invalidField: 'email' | 'code' | 'pin' | 'terms' | null = null;
    if (validateEmail(email)) invalidField = 'email';
    else if (validateActivationCode(code)) invalidField = 'code';
    else if (!PIN_PATTERN.test(pinTrimmed)) invalidField = 'pin';
    else if (!acceptedPrivacy) invalidField = 'terms';

    if (invalidField) {
      setTouched({ email: true, code: true, pin: true });
      if (invalidField === 'terms') setTermsWarning(true);

      const fieldRefs: Record<string, React.RefObject<HTMLInputElement>> = {
        email: emailRef,
        code: codeRef,
        pin: pinRef,
        terms: termsRef,
      };
      fieldRefs[invalidField].current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          email: formatEmailInput(email),
          pin: formatPinInput(pin),
          privacyAccepted: acceptedPrivacy,
          deviceId: getOrCreateDeviceId(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            'That code is not valid. Ask the front desk for a new one.'
        );
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
    <div className={styles.authCard}>
      <div className={styles.cardBody}>
        <div className={styles.brandLogoBox} aria-label="Spotter Logo">
          SPOTTER
        </div>

        <div className={styles.cardHeader}>
          <h1 className={styles.cardTitle}>Activate Member Account</h1>
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

        <form onSubmit={handleActivate} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="activationCode" className={styles.formLabel}>
              Activation Code
            </label>
            <input
              id="activationCode"
              name="code"
              type="text"
              inputMode="text"
              maxLength={8}
              placeholder="e.g. K7QP2M4X"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                if (error) setError('');
              }}
              onBlur={() => markTouched('code')}
              ref={codeRef}
              className={`${styles.formInput} ${codeError ? styles.inputInvalid : ''}`}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              required
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? 'activationCodeError' : undefined}
            />
            {codeError && (
              <span id="activationCodeError" className={styles.fieldError} role="status">
                <CautionIcon /> {codeError}
              </span>
            )}
          </div>

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
              onChange={(e) => {
                setEmail(formatEmailInput(e.target.value));
                if (error) setError('');
              }}
              onBlur={() => markTouched('email')}
              ref={emailRef}
              className={`${styles.formInput} ${emailError ? styles.inputInvalid : ''}`}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              required
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'accountEmailError' : undefined}
            />
            {emailError && (
              <span id="accountEmailError" className={styles.fieldError} role="status">
                <CautionIcon /> {emailError}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="accountPin" className={styles.formLabel}>
              Choose a 4-digit PIN
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
                onChange={(e) => {
                  setPin(formatPinInput(e.target.value));
                  if (error) setError('');
                }}
                onBlur={() => {
                  setPin((p) => formatPinInput(p));
                  markTouched('pin');
                }}
                ref={pinRef}
                className={`${styles.passwordInput} ${pinError ? styles.inputInvalid : ''}`}
                autoComplete="new-password"
                required
                aria-invalid={Boolean(pinError)}
                aria-describedby={pinDescribedBy}
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
            <span
              id="accountPinHint"
              className={`${styles.fieldHint} ${pinHintVisible ? '' : styles.visuallyHidden}`}
            >
              Your PIN must be exactly four digits.
            </span>
            {pinError && (
              <span id="accountPinError" className={styles.fieldError} role="status">
                <CautionIcon /> {pinError}
              </span>
            )}
          </div>

          <label className={styles.privacyCheck}>
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked);
                if (e.target.checked) setTermsWarning(false);
                if (error) setError('');
              }}
              ref={termsRef}
              required
              aria-invalid={termsInvalid}
              aria-describedby={termsInvalid ? 'accountTermsError' : undefined}
              style={{ marginTop: '3px' }}
            />
            <span>I accept the Spotter member privacy notice and terms of record access.</span>
          </label>

          {termsInvalid && (
            <span id="accountTermsError" className={styles.fieldError} role="status">
              <CautionIcon /> Please accept the terms and conditions to continue.
            </span>
          )}

          <span id="accountSubmitRequirements" className={styles.visuallyHidden}>
            {!isFormValid
              ? `Complete all fields to enable Activate Account. Still needed: ${unmetRequirements.join(', ')}.`
              : ''}
          </span>

          <button
            type="submit"
            disabled={submitting}
            aria-disabled={!isFormValid}
            aria-busy={submitting}
            aria-describedby={!isFormValid ? 'accountSubmitRequirements' : undefined}
            className={`${styles.submitBtn} ${!isFormValid ? styles.submitBtnDisabled : ''}`}
          >
            {submitting ? 'Activating...' : 'Activate Account'}
          </button>
        </form>
      </div>

      {/* Tinted Bottom Bar */}
      <div className={styles.cardFooter}>
        Already activated?{' '}
        <Link href="/auth?view=login" className={styles.footerLink}>
          Log In
        </Link>
      </div>
    </div>
  );
}
