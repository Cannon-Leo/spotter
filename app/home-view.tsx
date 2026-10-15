'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

interface MemberSessionInfo {
  id: string;
  effectiveTier: 'Basic' | 'Premium';
}

const FEATURES = [
  {
    number: '01',
    title: 'Check In',
    body: 'Generate a single-use six-digit code in the app and enter it at the door keypad for immediate arrival confirmation.',
  },
  {
    number: '02',
    title: 'My Records',
    body: 'Private attendance history and exact ledger balance read strictly by your authenticated member account.',
  },
  {
    number: '03',
    title: 'Ask About The Gym',
    body: "Direct answers grounded only in the gym's approved written records. Outdated or missing answers are never guessed.",
  },
  {
    number: '04',
    title: 'Pay & Renew',
    body: 'Extend membership instantly on verified payment confirmation. No delays or manual desk entry required.',
  },
  {
    number: '05',
    title: 'Ask The Desk',
    body: 'When a question is outside approved records, Spotter names the duty officer and opens WhatsApp with your query pre-typed.',
    link: 'https://wa.me/?text=Hello%20Front%20Desk,%20I%20have%20a%20question%20about%20my%20Spotter%20gym%20membership',
    linkText: 'Chat on WhatsApp →',
  },
];

export default function SpotterHome() {
  const [session, setSession] = useState<MemberSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showResetNotice, setShowResetNotice] = useState(false);

  // Activation form state
  const [activationCode, setActivationCode] = useState('');
  const [pin, setPin] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [activateError, setActivateError] = useState('');
  const [activateSubmitting, setActivateSubmitting] = useState(false);

  // Login form state
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.member) {
          setSession(data.member);
        }
      } catch {
        // Visitor mode
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // Handle Account Activation (PRD 6.1 FR-1 to FR-4)
  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setActivateError('');

    if (!activationCode.trim()) {
      setActivateError('That code is not valid. Ask the front desk for a new one.');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      setActivateError('Please choose a 4-digit security PIN.');
      return;
    }

    if (!acceptedPrivacy) {
      setActivateError('Please accept the member privacy notice to continue.');
      return;
    }

    setActivateSubmitting(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActivateError(data.error || 'That code is not valid. Ask the front desk for a new one.');
      } else {
        setSession(data.member);
        setShowActivateModal(false);
        setActivationCode('');
        setPin('');
      }
    } catch {
      setActivateError('That code is not valid. Ask the front desk for a new one.');
    } finally {
      setActivateSubmitting(false);
    }
  }

  // Handle 4-Digit PIN Sign-in (PRD FR-6, FR-7)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');

    if (!/^\d{4}$/.test(loginPin.trim())) {
      setLoginError('Enter your 4-digit PIN.');
      return;
    }

    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: loginPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid PIN.');
      } else {
        setSession(data.member);
        setShowLoginModal(false);
        setLoginPin('');
      }
    } catch {
      setLoginError('Failed to sign in. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  }

  // Handle Logout
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
  }

  if (loading) {
    return (
      <div className={styles.pageRoot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-secondary)', fontFamily: 'var(--typography-body-large-font-family)', fontWeight: 600 }}>
          Loading Spotter...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      {/* --------------------------------------------------------------------
       * Contained Layout (Centered max-width: 1140px, never stretches 100vw)
       * -------------------------------------------------------------------- */}
      <div className={styles.container}>
        {/* Top Navbar */}
        <header className={styles.navbar} role="banner">
          <div className={styles.navBrand}>
            <div className={styles.brandLogoBox} aria-label="Spotter Logo">
              SPOTTER
            </div>
            <span className={styles.brandSubtitle}>Official Gym Member Portal</span>
          </div>

          <div className={styles.navActions}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--typography-label-medium-font-size)', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  Member #{session.id.slice(0, 5)} ({session.effectiveTier})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.navLogInBtn}
                  aria-label="Sign out of Spotter"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className={styles.navLogInBtn}
                  aria-label="Log in with PIN"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivateModal(true)}
                  className={styles.navSignUpBtn}
                  aria-label="Sign up / activate account"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className={styles.heroSection} aria-label="Introduction">
          <div className={styles.recordsBadge}>
            100% Approved Gym Records
          </div>

          <h1 className={styles.heroHeadline}>
            Your Gym. Your Records.<br />Instant Access.
          </h1>

          <p className={styles.heroSubtitle}>
            Spotter is designed for gym members. Generate your check-in code, view your verified
            personal attendance and ledger balance, and get verified answers anytime.
          </p>

          <div className={styles.heroCtaRow}>
            {session ? (
              <button
                type="button"
                onClick={handleLogout}
                className={styles.primaryCtaBtn}
              >
                Sign Out of Portal
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className={styles.primaryCtaBtn}
                  aria-label="Log In to Member Portal"
                >
                  Log In to Member Portal
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivateModal(true)}
                  className={styles.secondaryCtaBtn}
                  aria-label="Create Member Account"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetNotice(true)}
                  className={styles.resetLink}
                  aria-label="Temporary password reset instructions"
                >
                  Have a temporary password? Reset here &rarr;
                </button>
              </>
            )}
          </div>

          {session && (
            <div className={styles.userBanner}>
              <div>
                <strong>Active Session:</strong> Logged in as Member #{session.id.slice(0, 5)} &bull; {session.effectiveTier} Tier
              </div>
              <span style={{ fontSize: 'var(--typography-body-small-font-size)', color: 'var(--color-secondary)' }}>
                Session verified &bull; 0 days trained this month
              </span>
            </div>
          )}
        </section>

        {/* Built For Member Independence Section */}
        <section className={styles.featuresSection} aria-label="Built For Member Independence">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built For Member Independence</h2>
            <p className={styles.sectionSubtitle}>
              Five core features with zero clutter, zero ads, and instant confirmation.
            </p>
          </div>

          {/* 5 Feature Cards Grid (3 top, 2 bottom) */}
          <div className={styles.cardsGrid}>
            {FEATURES.map((item) => (
              <article key={item.number} className={styles.featureCard}>
                <span className={styles.cardNumber}>{item.number}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardBody}>{item.body}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardLink}
                    aria-label="Chat with Desk Officer on WhatsApp"
                  >
                    {item.linkText}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* --------------------------------------------------------------------
       * Temporary PIN / Reset Notice Modal (PRD FR-5b)
       * -------------------------------------------------------------------- */}
      {showResetNotice && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="resetModalTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 id="resetModalTitle" className={styles.modalTitle}>PIN Reset &amp; Re-link</h2>
              <button
                type="button"
                onClick={() => setShowResetNotice(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <p className={styles.modalSubtext}>
              Per gym security policy (PRD FR-5b), PIN resets and temporary codes are issued directly by the
              front desk officer to your registered WhatsApp number or in person.
            </p>
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <a
                href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20need%20a%20temporary%20code%20or%20PIN%20reset%20for%20my%20Spotter%20account"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalSubmitBtn}
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                Request Code from Front Desk &rarr;
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowResetNotice(false);
                  setShowActivateModal(true);
                }}
                className={styles.secondaryCtaBtn}
              >
                Enter Activation Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
       * Activation / Sign Up Modal (PRD 6.1 FR-1, FR-2, FR-3, FR-4)
       * -------------------------------------------------------------------- */}
      {showActivateModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="activateModalTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 id="activateModalTitle" className={styles.modalTitle}>Activate Member Account</h2>
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <p className={styles.modalSubtext}>
              Enter the 8-character activation code issued in person or via registered WhatsApp by the front desk officer.
            </p>

            {activateError && <div className={styles.errorBanner} role="alert">{activateError}</div>}

            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className={styles.formGroup}>
                <label htmlFor="activationCodeInput" className={styles.formLabel}>
                  8-Character Activation Code
                </label>
                <input
                  id="activationCodeInput"
                  name="activationCode"
                  type="text"
                  maxLength={10}
                  placeholder="e.g. SPT4X9KL"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  className={styles.formInput}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="setPinInput" className={styles.formLabel}>
                  Choose Your 4-Digit Security PIN
                </label>
                <input
                  id="setPinInput"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.formInput}
                  autoComplete="new-password"
                  required
                />
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
                disabled={activateSubmitting}
                className={styles.modalSubmitBtn}
              >
                {activateSubmitting ? 'Activating Account...' : 'Complete Activation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
       * PIN Login Modal (PRD 6.1 FR-6, FR-7)
       * -------------------------------------------------------------------- */}
      {showLoginModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 id="loginModalTitle" className={styles.modalTitle}>Member Sign In</h2>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <p className={styles.modalSubtext}>
              Enter your personal 4-digit security PIN to access your membership records.
            </p>

            {loginError && <div className={styles.errorBanner} role="alert">{loginError}</div>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className={styles.formGroup}>
                <label htmlFor="loginPinInput" className={styles.formLabel}>
                  4-Digit Security PIN
                </label>
                <input
                  id="loginPinInput"
                  name="loginPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.formInput}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className={styles.modalSubmitBtn}
              >
                {loginSubmitting ? 'Verifying PIN...' : 'Log In to Member Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
