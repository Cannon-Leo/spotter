'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './theme-toggle';
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
      }
    }
    checkSession();
  }, []);

  // Handle Logout
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
  }



  return (
    <div className={styles.pageRoot}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      {/* --------------------------------------------------------------------
       * Contained Layout (Centered max-width: 1140px, never stretches 100vw)
       * -------------------------------------------------------------------- */}
      <div className={styles.container} id="main-content" tabIndex={-1}>
        {/* Top Navbar */}
        <header className={styles.navbar} role="banner">
          <div className={styles.navBrand}>
            <Link href="/" aria-label="Spotter Home" className={styles.brandLogoSquare}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true" focusable="false">
                <rect width="32" height="32" rx="6" fill="var(--color-secondary)" />
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="var(--color-on-secondary)" fontFamily="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="20">S</text>
              </svg>
            </Link>
          </div>

          <div className={styles.navActions}>
            <ThemeToggle />
            {session ? (
              <>
                <span className={styles.memberChip}>
                  Member #{session.id.slice(0, 5)} ({session.effectiveTier})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.navSignOutBtn}
                  aria-label="Sign out of Spotter"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/create-account"
                className={styles.navGetStartedBtn}
                aria-label="Get started with Spotter"
              >
                Get Started
              </Link>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className={styles.heroSection} aria-label="Introduction">
          <h1 className={styles.heroHeadline}>
            <span>Your Gym. Your Records.</span>
            <span className={styles.heroHeadlineBreak}>Instant Access.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            <span>Check in, view attendance and balance,</span>
            <span className={styles.heroSubtitleBreak}>
              and get verified answers instantly.
            </span>
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
              <Link
                href="/create-account"
                className={styles.primaryCtaBtn}
                aria-label="Get started for free"
              >
                Get started for free
              </Link>
            )}
          </div>

          {session && (
            <div className={styles.userBanner}>
              <div>
                <strong>Active Session:</strong> Logged in as Member #{session.id.slice(0, 5)} &bull; {session.effectiveTier} Tier
              </div>
              <span className={styles.userBannerMeta}>
                Session verified &bull; 0 days trained this month
              </span>
            </div>
          )}
        </section>

        {/* Card Section */}
        <section className={styles.cardSection} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="features-heading">Built For Member Independence</h2>
            <p className={styles.sectionSubtitle}>
              Five core features with zero clutter, zero ads, and instant confirmation.
            </p>
          </div>

          {/* Bento grid: 5 tiles tile the full width with no hole, and a 6th tile
              drops into the standard 3 x 2 pattern without resizing anything. */}
          <div className={styles.cardsGrid}>
            {FEATURES.map((item) => (
              <article key={item.number} className={styles.featureCard}>
                <span className={styles.cardNumber} aria-hidden="true">{item.number}</span>
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

        {/* Info Section */}
        <section className={styles.infoSection} aria-label="Privacy and member records notice">
          <div className={styles.infoCard}>
            <p className={styles.infoText}>
              <strong className={styles.infoHighlight}>Private by design.</strong>{' '}
              Your records are accessed only by your session member ID. Never embedded, never searched across other members, and no push notifications or marketing spam.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
