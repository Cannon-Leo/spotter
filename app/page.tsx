'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

// 8 Recurring questions from the reference UI
const QUESTIONS_DATA = [
  {
    q: 'What time is the Saturday class?',
    a: 'Saturday HIIT and Strength classes start at 8:00 AM and 10:00 AM in the main studio.',
    source: 'Studio Schedule Card v2 (Approved)',
  },
  {
    q: 'Can I bring a guest with me?',
    a: 'Premium tier members may bring 1 complimentary guest per month. Basic members can register guests at the front desk for ₦2,000.',
    source: 'Guest Policy Card v1 (Approved)',
  },
  {
    q: 'Why is my card not working before six?',
    a: 'Basic memberships include access during standard hours (6:00 AM – 9:00 PM). Access before 6:00 AM is reserved for Premium members.',
    source: 'Access Tiers Card v3 (Approved)',
  },
  {
    q: 'What are the gym access hours?',
    a: 'Monday to Friday: 5:30 AM – 10:00 PM. Saturday: 7:00 AM – 8:00 PM. Sunday: 8:00 AM – 6:00 PM.',
    source: 'Operating Hours Card v2 (Approved)',
  },
  {
    q: 'What is the current subscription price?',
    a: 'Basic Monthly is ₦25,000/month. Premium Annual is ₦250,000/year. Payment can be renewed instantly via Flutterwave.',
    source: 'Membership Pricing 2026 (Approved)',
  },
  {
    q: 'How do I pause my membership?',
    a: 'Memberships can be paused for up to 30 days once per calendar year with 48 hours notice to the front desk.',
    source: 'Membership Pause Policy v1 (Approved)',
  },
  {
    q: 'What training plans are available?',
    a: 'Beginner Foundations, Hypertrophy, Cardio Conditioning, and Functional Strength plans are accessible to all active tiers.',
    source: 'Training Programs v2 (Approved)',
  },
  {
    q: 'Who is the trainer on duty today?',
    a: 'Today\'s floor coaches are Coach Tunde (Morning: 6:00 AM - 2:00 PM) and Coach Chioma (Evening: 2:00 PM - 10:00 PM).',
    source: 'Staff Roster Card v4 (Approved)',
  },
];

interface MemberSessionInfo {
  id: string;
  effectiveTier: 'Basic' | 'Premium';
}

export default function SpotterHome() {
  const [session, setSession] = useState<MemberSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected question & answer preview
  const [selectedQuestion, setSelectedQuestion] = useState<{
    q: string;
    a: string;
    source: string;
  } | null>(null);
  const [reportedAnswer, setReportedAnswer] = useState<boolean>(false);

  // Modal states
  const [showAuthChooser, setShowAuthChooser] = useState(false);
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

  // Fetch session on load
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

  // Handle Question Chip Click
  function handleQuestionClick(item: typeof QUESTIONS_DATA[0]) {
    setSelectedQuestion(item);
    setReportedAnswer(false);
  }

  // Handle Reporting an Answer (PRD FR-49)
  function handleReport() {
    setReportedAnswer(true);
  }

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
        setShowAuthChooser(false);
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
        setShowAuthChooser(false);
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
    setSelectedQuestion(null);
  }

  if (loading) {
    return (
      <div className={styles.pageRoot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-secondary)', fontFamily: 'var(--typography-body-large-font-family)', fontWeight: 600 }}>
          Loading Spotter Portal...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      {/* --------------------------------------------------------------------
       * Top Navigation Bar (Exact match to reference)
       * -------------------------------------------------------------------- */}
      <header className={styles.navbar} role="banner">
        <div className={styles.navBrand}>
          <div className={styles.brandLogoBox} aria-label="Spotter Logo">
            SPOTTER
          </div>
          <span className={styles.brandSubtitle}>Official Member Portal</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.portalBadge} role="status">
            Active Gym Portal
          </span>
        </div>
      </header>

      {/* --------------------------------------------------------------------
       * Main Split Layout (Left: Marketing / Right: Member Portal Card)
       * -------------------------------------------------------------------- */}
      <main className={styles.mainLayout}>
        {/* LEFT COLUMN: Marketing & Capabilities */}
        <section className={styles.marketingCol} aria-label="Portal Capabilities">
          <div className={styles.recordsBadge}>
            100% Approved Gym Records
          </div>

          <h1 className={styles.mainHeadline}>
            Your Gym. Your Records.<br />Instant Access.
          </h1>

          <p className={styles.mainSubtitle}>
            Spotter is built for gym members. Generate your check in code, check your
            personal attendance and balance, ask questions, and pay your subscription
            with instant confirmation.
          </p>

          {/* 2x2 Feature Grid */}
          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" />
                </svg>
                <h2 className={styles.featureTitle}>1. Check In</h2>
              </div>
              <p className={styles.featureBody}>
                Generate a single-use six digit code in the app and enter it at the door keypad.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h2 className={styles.featureTitle}>2. My Records</h2>
              </div>
              <p className={styles.featureBody}>
                Your exact attendance dates and balance, read privately from the gym ledger.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h2 className={styles.featureTitle}>3. Ask About The Gym</h2>
              </div>
              <p className={styles.featureBody}>
                Accurate answers grounded only in the gym&apos;s approved written records.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <h2 className={styles.featureTitle}>4. Pay &amp; Renew</h2>
              </div>
              <p className={styles.featureBody}>
                Renew your membership via Flutterwave. Payment automatically extends your expiry.
              </p>
            </article>
          </div>

          {/* Full-width 5. Ask The Desk */}
          <article className={styles.deskCard}>
            <div className={styles.deskCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <h2 className={styles.deskCardTitle}>5. Ask The Desk</h2>
              </div>
            </div>
            <p className={styles.deskCardBody}>
              When a question is outside the gym&apos;s records, Spotter names the officer on duty
              and opens WhatsApp with your question pre-typed.
            </p>
            <a
              href="https://wa.me/?text=Hello%20Front%20Desk,%20I%20have%20a%20question%20about%20my%20Spotter%20gym%20membership"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.deskWhatsappLink}
              aria-label="Chat with Desk Officer on WhatsApp"
            >
              Chat with Desk Officer on WhatsApp &rarr;
            </a>
          </article>
        </section>

        {/* RIGHT COLUMN: Member Portal Card (Matching screenshot preview & live state) */}
        <section className={styles.portalCard} aria-label="Member Portal Quick View">
          {/* Member Profile Row */}
          <div className={styles.memberHeader}>
            <div>
              <div className={styles.memberName}>
                {session ? `Member #${session.id.slice(0, 5)}` : 'Joseph Brendan'}
              </div>
              <div className={styles.memberEmail}>
                {session ? 'session.active@spottergym.com' : 'jbrendan86@gmail.com'}
              </div>
            </div>
            <span className={styles.memberIdBadge}>
              {session ? `#${session.id.slice(0, 5)}` : '#48583'}
            </span>
          </div>

          {/* 2x2 Status Matrix */}
          <div className={styles.statusMatrix}>
            <div className={styles.statusBox}>
              <span className={styles.statusBoxLabel}>Effective Tier</span>
              <span className={styles.statusBoxValue}>
                {session ? `${session.effectiveTier} Member` : 'Basic Member'}
              </span>
            </div>
            <div className={styles.statusBox}>
              <span className={styles.statusBoxLabel}>Expiry Date</span>
              <span className={styles.statusBoxValue}>Active</span>
            </div>
            <div className={styles.statusBox}>
              <span className={styles.statusBoxLabel}>Attendance</span>
              <span className={styles.statusBoxValue}>0 days this month</span>
            </div>
            <div className={styles.statusBox}>
              <span className={styles.statusBoxLabel}>Balance</span>
              <span className={styles.statusBoxValue}>Nothing due.</span>
            </div>
          </div>

          {/* Section: Ask About The Gym */}
          <h2 className={styles.questionsTitle}>Ask About The Gym</h2>

          {/* 8 Question Chips Grid */}
          <div className={styles.questionsGrid} role="group" aria-label="Popular Questions">
            {QUESTIONS_DATA.map((item, idx) => {
              const isSelected = selectedQuestion?.q === item.q;
              return (
                <button
                  key={idx}
                  type="button"
                  className={styles.questionChip}
                  style={isSelected ? { borderColor: 'var(--color-secondary)', backgroundColor: 'var(--color-surface-container-highest)' } : undefined}
                  onClick={() => handleQuestionClick(item)}
                  aria-pressed={isSelected}
                >
                  {item.q}
                </button>
              );
            })}
          </div>

          {/* Answer Preview Box (Grounded Check from PRD 7.7) */}
          {selectedQuestion && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-container-high)',
                border: '1px solid var(--color-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
              role="region"
              aria-label="Question Answer"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                  Grounded Answer • {selectedQuestion.source}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontSize: '14px' }}
                  aria-label="Close answer"
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--typography-body-small-font-size)', color: 'var(--color-on-background)', lineHeight: 1.5 }}>
                {selectedQuestion.a}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-1)' }}>
                {reportedAnswer ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
                    ✓ Flagged for owner weekly audit (FR-49)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleReport}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-on-surface-variant)',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Report incorrect answer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Action Button */}
          {session ? (
            <button
              type="button"
              className={styles.bottomActionBtn}
              onClick={handleLogout}
              aria-label="Sign out of Spotter"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              className={styles.bottomActionBtn}
              onClick={() => setShowAuthChooser(true)}
              aria-label="Sign In or Activate Member Account"
            >
              Sign In / Activate
            </button>
          )}
        </section>
      </main>

      {/* --------------------------------------------------------------------
       * Auth Selection Modal
       * -------------------------------------------------------------------- */}
      {showAuthChooser && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="authChooserTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 id="authChooserTitle" className={styles.modalTitle}>Member Access</h2>
              <button
                type="button"
                onClick={() => setShowAuthChooser(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <p className={styles.modalSubtext}>
              Spotter is exclusively for members of this gym. Choose how you would like to proceed:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className={styles.modalSubmitBtn}
                onClick={() => {
                  setShowAuthChooser(false);
                  setShowLoginModal(true);
                }}
              >
                Sign In with 4-Digit PIN
              </button>
              <button
                type="button"
                className={styles.bottomActionBtn}
                style={{ marginTop: 0 }}
                onClick={() => {
                  setShowAuthChooser(false);
                  setShowActivateModal(true);
                }}
              >
                Activate Account (New Code)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
       * Activation Modal (PRD 6.1 FR-1, FR-2, FR-3, FR-4)
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
                aria-label="Close activation dialog"
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
                aria-label="Close sign in dialog"
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
                {loginSubmitting ? 'Verifying PIN...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
