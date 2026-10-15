'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// 8 Recurring questions from PRD 5.4 / 6.2
const SUGGESTED_QUESTIONS = [
  'What time is the Saturday class?',
  'Can I bring a guest?',
  'Why is my card not working before 6?',
  'How many days have I trained this month?',
  'Do I still owe for July?',
  'What are the gym opening hours?',
  'How do I renew my membership?',
  'What time does the gym close today?',
];

interface MemberSessionInfo {
  id: string;
  effectiveTier: 'Basic' | 'Premium';
}

export default function SpotterHome() {
  const [session, setSession] = useState<MemberSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Activation form fields
  const [activationCode, setActivationCode] = useState('');
  const [pin, setPin] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [activateError, setActivateError] = useState('');
  const [activateSubmitting, setActivateSubmitting] = useState(false);

  // Login form fields
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
        // Unauthenticated visitor
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // Handle Activation submission (PRD 6.1 FR-1 to FR-4)
  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setActivateError('');

    if (!activationCode.trim()) {
      setActivateError('That code is not valid. Ask the front desk for a new one.');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      setActivateError('Please enter a 4-digit security PIN.');
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
      <div className={styles.pageWrapper}>
        <div style={{ margin: 'auto', color: 'var(--color-primary)' }}>Loading Spotter...</div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Authenticated Member Dashboard
  // --------------------------------------------------------------------------
  if (session) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.dashboardContainer}>
          {/* Header */}
          <header className={styles.dashboardHeader}>
            <div className={styles.brandGroup}>
              <div className={styles.brandLogo}>S</div>
              <div>
                <h1 className={styles.brandName}>Spotter</h1>
                <span className={styles.gymBadge}>{session.effectiveTier} Member</span>
              </div>
            </div>
            <div className={styles.memberMeta}>
              <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
                Sign Out
              </button>
            </div>
          </header>

          {/* Status Card (PRD 6.2 / FR-8 / FR-8b) */}
          <section className={styles.statusCard} aria-label="Membership Status">
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Days trained this month</span>
              <span className={styles.statusValue}>0 days</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Balance</span>
              <span className={styles.statusValue}>0.00 naira</span>
            </div>
            <p className={styles.balanceFraming}>
              Correct as of today, based on payments recorded here.
            </p>
          </section>

          {/* Daily Check-In Widget (PRD 6.5 / F-3) */}
          <div className={styles.checkInBox}>
            <div>
              <div style={{ fontWeight: 600 }}>Daily Check In</div>
              <div style={{ fontSize: 'var(--typography-label-small-font-size)' }}>
                Enter today&apos;s 4-digit code on the board
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                maxLength={4}
                placeholder="0000"
                className={styles.checkInInput}
                aria-label="4-digit daily check-in code"
              />
              <button type="button" className={styles.checkInBtn}>
                Check In
              </button>
            </div>
          </div>

          {/* 8 Suggested Questions (PRD 6.2 / FR-9) */}
          <section className={styles.questionsScrollArea} aria-label="Suggested Questions">
            <div style={{ fontSize: 'var(--typography-label-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
              Suggested questions
            </div>
            {SUGGESTED_QUESTIONS.map((question, idx) => (
              <button key={idx} type="button" className={styles.questionChip}>
                {question}
              </button>
            ))}
          </section>

          {/* Bottom Free Typing Bar (PRD 6.2 / FR-9) */}
          <footer className={styles.bottomInputBar}>
            <input
              type="text"
              placeholder="Ask a question about the gym..."
              className={styles.chatInput}
              aria-label="Ask a question"
            />
            <button type="button" className={styles.chatSubmitBtn}>
              Ask
            </button>
          </footer>
        </main>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Unauthenticated 100vh Marketing Page (Rich Design System Experience)
  // --------------------------------------------------------------------------
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.marketingContainer}>
        {/* Top Navigation */}
        <header className={styles.topNav}>
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>S</div>
            <div>
              <div className={styles.brandName}>Spotter</div>
              <span className={styles.gymBadge}>Single Gym • 400 Members</span>
            </div>
          </div>
          <div className={styles.navActions}>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className={styles.navSignInBtn}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setShowActivateModal(true)}
              className={styles.navActivateBtn}
            >
              Activate
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroTag}>
            <span>Approved Records Only</span>
            <span>•</span>
            <span>Zero Hallucinations</span>
          </div>

          <h1 className={styles.heroHeadline}>
            Your gym, on your time.{' '}
            <span className={styles.heroHeadlineAccent}>Instant facts, no guessing.</span>
          </h1>

          <p className={styles.heroSubhead}>
            Spotter answers your gym questions exclusively from approved records, lets you check in
            with daily 4-digit codes, views your private attendance, and extends your subscription
            right away with no staff delay.
          </p>

          <div className={styles.heroCtaGroup}>
            <button
              type="button"
              onClick={() => setShowActivateModal(true)}
              className={styles.primaryCta}
            >
              Activate Member Account
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className={styles.secondaryCta}
            >
              Sign In with PIN
            </button>
          </div>
        </section>

        {/* 4 Core PRD Capabilities Highlight */}
        <section className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBadge} ${styles.badgeAsk}`}>Q&amp;A</div>
            <div className={styles.featureTitle}>Ask About The Gym</div>
            <p className={styles.featureDesc}>
              Answers strictly grounded in owner-approved cards. If the records hold no answer, Spotter
              hands you directly to the desk officer.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBadge} ${styles.badgeCheckIn}`}>✓</div>
            <div className={styles.featureTitle}>Daily Check-In</div>
            <p className={styles.featureDesc}>
              Fast 4-digit daily code entered inside the building during opening hours. Attendance is
              a verifiable fact, not a memory.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBadge} ${styles.badgeRecords}`}>#</div>
            <div className={styles.featureTitle}>My Private Records</div>
            <p className={styles.featureDesc}>
              View personal attendance and balances scoped strictly to your own session, always
              pointing to a source confirmation date.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBadge} ${styles.badgePay}`}>₦</div>
            <div className={styles.featureTitle}>Instant Renewal</div>
            <p className={styles.featureDesc}>
              Pay renewal or arrears in seconds. Confirmed webhooks extend your membership immediately
              without waiting on front desk staff.
            </p>
          </div>
        </section>

        {/* Front Desk Duty Officer WhatsApp Handoff (PRD 6.7) */}
        <footer className={styles.deskBanner}>
          <div className={styles.deskInfo}>
            <div className={styles.dutyDot} />
            <span>Duty Officer: <strong>Chioma</strong></span>
            <span style={{ color: 'var(--color-on-surface-variant)' }}>• Front Desk open until 8:00 PM</span>
          </div>
          <a
            href="https://wa.me/?text=Hi%20Chioma,%20I%20have%20a%20question%20about%20the%20gym"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.deskBtn}
          >
            Message on WhatsApp
          </a>
        </footer>
      </div>

      {/* --------------------------------------------------------------------
       * Activation Modal (PRD 6.1 FR-1, FR-2, FR-3, FR-4)
       * -------------------------------------------------------------------- */}
      {showActivateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Activate Account</h2>
                <p className={styles.modalSubtext}>
                  Enter the 8-character code issued by the desk in person or via registered WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {activateError && <div className={styles.errorBanner}>{activateError}</div>}

            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>8-Character Activation Code</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. SPT4X9KL"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Set 4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.formInput}
                  required
                />
              </div>

              <label className={styles.privacyNoticeCheck}>
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  required
                />
                <span>I accept the Spotter member privacy notice (FR-58)</span>
              </label>

              <button
                type="submit"
                disabled={activateSubmitting}
                className={styles.modalSubmitBtn}
              >
                {activateSubmitting ? 'Activating...' : 'Complete Activation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
       * PIN Login Modal (PRD 6.1 FR-6, FR-7)
       * -------------------------------------------------------------------- */}
      {showLoginModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Member Sign In</h2>
                <p className={styles.modalSubtext}>Enter your 4-digit PIN to access your account.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loginError && <div className={styles.errorBanner}>{loginError}</div>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.formInput}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className={styles.modalSubmitBtn}
              >
                {loginSubmitting ? 'Verifying...' : 'Unlock Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
