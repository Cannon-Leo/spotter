'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
      {/* --------------------------------------------------------------------
       * Contained Layout (Centered max-width: 1140px, never stretches 100vw)
       * -------------------------------------------------------------------- */}
      <div className={styles.container}>
        {/* Top Navbar */}
        <header className={styles.navbar} role="banner">
          <div className={styles.navBrand}>
            <Link href="/" aria-label="Spotter Home" className={styles.brandLogoSquare}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="#008f70" />
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20">S</text>
              </svg>
            </Link>
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
                  className={styles.navSignOutBtn}
                  aria-label="Sign out of Spotter"
                >
                  Sign Out
                </button>
              </div>
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
            Your Gym. Your Records.<br />Instant Access.
          </h1>

          <p className={styles.heroSubtitle}>
            Check in, view attendance and balance, and get verified answers instantly.
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
    </div>
  );
}
