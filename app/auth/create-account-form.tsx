'use client';

import React, { useRef, useState } from 'react';
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MEMBER_NUMBER_PATTERN = /^\d{6}$/;

function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address';
  return '';
}

function validateMemberNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (!MEMBER_NUMBER_PATTERN.test(trimmed)) return 'Member number must be exactly 6 digits';
  return '';
}

function validateFullName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'This field must not be empty';
  if (trimmed.length < 2) return 'Full name must be at least 2 characters';
  if (trimmed.split(/\s+/).length < 2) return 'Enter at least two names separated by a space';
  return '';
}

export default function CreateAccountForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [termsWarning, setTermsWarning] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    code: false,
    pin: false,
  });

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const fullNameError = touched.fullName ? validateFullName(fullName) : '';
  const emailStarted = touched.email || email.trim().length > 0;
  const emailError = emailStarted ? validateEmail(email) : '';
  const codeError = touched.code ? validateMemberNumber(code) : '';
  const pinTrimmed = pin.trim();
  const pinError = touched.pin
    ? !pinTrimmed
      ? 'This field must not be empty'
      : pinTrimmed.length < 4
        ? 'Password must be at least 4 characters'
        : ''
    : '';
  const pinHintVisible = pin.length > 0 && !pinError;
  const pinDescribedBy = pinError ? 'accountPinError' : 'accountPinHint';
  const termsInvalid = termsWarning && !acceptedPrivacy;
  const isFormValid =
    !validateFullName(fullName) &&
    !validateEmail(email) &&
    !validateMemberNumber(code) &&
    pinTrimmed.length >= 4 &&
    acceptedPrivacy;

  const unmetRequirements: string[] = [];
  if (validateFullName(fullName)) unmetRequirements.push('a full name with at least two names');
  if (validateEmail(email)) unmetRequirements.push('a valid email address');
  if (validateMemberNumber(code)) unmetRequirements.push('a 6-digit member number');
  if (pinTrimmed.length < 4) unmetRequirements.push('a password of at least 4 characters');
  if (!acceptedPrivacy) unmetRequirements.push('acceptance of the terms and conditions');

  function markTouched(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let invalidField: 'fullName' | 'email' | 'code' | 'pin' | 'terms' | null = null;
    if (validateFullName(fullName)) invalidField = 'fullName';
    else if (validateEmail(email)) invalidField = 'email';
    else if (validateMemberNumber(code)) invalidField = 'code';
    else if (pinTrimmed.length < 4) invalidField = 'pin';
    else if (!acceptedPrivacy) invalidField = 'terms';

    if (invalidField) {
      setTouched({ fullName: true, email: true, code: true, pin: true });
      if (invalidField === 'terms') setTermsWarning(true);

      const fieldRefs: Record<string, React.RefObject<HTMLInputElement>> = {
        fullName: fullNameRef,
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
          name: fullName.trim(),
          email: email.trim(),
          code: code.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            'That member number could not be accepted. Ask the front desk to confirm it.'
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
          <h1 className={styles.cardTitle}>Create Member Account</h1>
          <p className={styles.cardSubtitle}>
            Enter the 6-digit member number issued by the front desk.
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
            <label htmlFor="accountFullName" className={styles.formLabel}>
              Full Name
            </label>
            <input
              id="accountFullName"
              name="fullName"
              type="text"
              placeholder="Chioma Okonkwo"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError('');
              }}
              onBlur={() => markTouched('fullName')}
              ref={fullNameRef}
              className={`${styles.formInput} ${fullNameError ? styles.inputInvalid : ''}`}
              autoComplete="name"
              required
              aria-invalid={Boolean(fullNameError)}
              aria-describedby={fullNameError ? 'accountFullNameError' : undefined}
            />
            {fullNameError && (
              <span id="accountFullNameError" className={styles.fieldError} role="status">
                <CautionIcon /> {fullNameError}
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
                setEmail(e.target.value);
                if (error) setError('');
              }}
              onBlur={() => markTouched('email')}
              ref={emailRef}
              className={`${styles.formInput} ${emailError ? styles.inputInvalid : ''}`}
              autoComplete="email"
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
            <label htmlFor="activationCode" className={styles.formLabel}>
              Member Number
            </label>
            <input
              id="activationCode"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                if (error) setError('');
              }}
              onBlur={() => markTouched('code')}
              ref={codeRef}
              className={`${styles.formInput} ${codeError ? styles.inputInvalid : ''}`}
              autoComplete="one-time-code"
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
            <label htmlFor="accountPin" className={styles.formLabel}>
              Choose a Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="accountPin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                placeholder="••••••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                onBlur={() => markTouched('pin')}
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
                aria-label={showPin ? 'Hide password' : 'Show password'}
              >
                {showPin ? 'Hide' : 'Show'}
              </button>
            </div>
            <span
              id="accountPinHint"
              className={`${styles.fieldHint} ${pinHintVisible ? '' : styles.visuallyHidden}`}
            >
              Password must be at least 4 characters.
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
              ? `Complete all fields to enable Create Account. Still needed: ${unmetRequirements.join(', ')}.`
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
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Tinted Bottom Bar */}
      <div className={styles.cardFooter}>
        Already a member?{' '}
        <Link href="/auth?view=login" className={styles.footerLink}>
          Log In
        </Link>
      </div>
    </div>
  );
}
