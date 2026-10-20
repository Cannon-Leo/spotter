'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from './theme-toggle';
import styles from './page.module.css';
import Footer from './footer';
import StripedBackground from './striped-background';
import SpotterLogo from './spotter-logo';
import PrivacyView from './privacy-view';
import TermsView from './terms-view';

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
  const [activeView, setActiveView] = useState<'home' | 'privacy' | 'terms'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasOpenedMenuRef = useRef(false);

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

  // Mobile drawer behaviour: Escape closes it, page scroll is locked while it
  // covers the screen, and resizing up to desktop closes it so the inline
  // header row takes over cleanly.
  useEffect(() => {
    if (!isMenuOpen) return;

    const media = window.matchMedia('(max-width: 768px)');
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        return;
      }

      // Keep Tab cycling inside the full-screen drawer.
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (!event.matches) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    media.addEventListener('change', handleBreakpointChange);
    if (media.matches) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      media.removeEventListener('change', handleBreakpointChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  // Move focus into the drawer when it opens and back to the hamburger when
  // it closes, so keyboard and screen reader users are never left behind it.
  useEffect(() => {
    if (isMenuOpen) {
      hasOpenedMenuRef.current = true;
      menuCloseRef.current?.focus();
    } else if (hasOpenedMenuRef.current) {
      menuToggleRef.current?.focus();
    }
  }, [isMenuOpen]);

  // Synchronize view with URL query parameters (?view=privacy, ?view=terms) or hash
  useEffect(() => {
    function syncViewFromUrl() {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'privacy' || viewParam === 'terms') {
        setActiveView(viewParam);
      } else if (window.location.hash === '#privacy') {
        setActiveView('privacy');
      } else if (window.location.hash === '#terms') {
        setActiveView('terms');
      } else {
        setActiveView('home');
      }
    }

    syncViewFromUrl();
    window.addEventListener('popstate', syncViewFromUrl);
    return () => window.removeEventListener('popstate', syncViewFromUrl);
  }, []);

  const handleSelectView = (view: 'privacy' | 'terms') => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/?view=${view}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToHome = () => {
    setActiveView('home');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Logout
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
  }

  // Shared between the desktop header row and the mobile slide-in drawer.
  // Only one of the two is ever displayed, so the screen reader tree never
  // contains two copies of the same control.
  const navActionContent = session ? (
    <>
      <span className={styles.memberChip}>
        Member #{session.id.slice(0, 5)} ({session.effectiveTier})
      </span>
      <button
        type="button"
        onClick={() => {
          setIsMenuOpen(false);
          handleLogout();
        }}
        className={styles.navSignOutBtn}
      >
        Sign Out
      </button>
    </>
  ) : (
    <Link
      href="/create-account"
      className={styles.navGetStartedBtn}
      onClick={() => setIsMenuOpen(false)}
    >
      Get Started
    </Link>
  );

  return (
    <div className={styles.pageRoot}>
      <StripedBackground />
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Conditional Legal Views rendered directly on the home page */}
      {activeView === 'privacy' && (
        <PrivacyView onBack={handleBackToHome} />
      )}

      {activeView === 'terms' && (
        <TermsView onBack={handleBackToHome} />
      )}

      {/* Default Marketing Home View */}
      {activeView === 'home' && (
        <>
          {/* Top Sticky Navigation Bar */}
          <header className={styles.stickyHeader}>
            <div className={styles.navbarInner}>
              <div className={styles.navBrand}>
                <Link href="/" className={styles.brandLogoSquare} aria-label="Spotter Home">
                  <SpotterLogo size={36} className={styles.brandLogoMark} />
                </Link>
                <span className={styles.brandTitle}>Spotter</span>
              </div>

              <div className={styles.navActions}>
                <div className={styles.navThemeToggleBtn}>
                  <ThemeToggle />
                </div>

                {/* Inline desktop actions */}
                <div className={styles.navMenu}>{navActionContent}</div>

                <button
                  ref={menuToggleRef}
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className={styles.navMenuToggle}
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                  aria-controls="primary-navigation"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile full-screen drawer: slides in from the right edge */}
          <div
            ref={drawerRef}
            id="primary-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className={`${styles.mobileDrawer} ${isMenuOpen ? styles.mobileDrawerOpen : ''}`}
          >
            <div className={styles.mobileDrawerTopBar}>
              <button
                ref={menuCloseRef}
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className={styles.mobileDrawerClose}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className={styles.mobileDrawerContent}>{navActionContent}</div>
          </div>

          <main id="main-content" tabIndex={-1} className={styles.container}>
            {/* Hero Section */}
          <section className={styles.heroSection}>
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

            <div className={styles.heroActions}>
              <Link
                href="/create-account"
                className={styles.primaryCtaBtn}
              >
                Get Started
              </Link>
            </div>
          </section>

          {/* Card Section: 5 feature cards */}
          <section className={styles.cardSection} aria-labelledby="features-heading">
            <div className={styles['section_card-text']}>
              <h2 id="features-heading" className={styles.featuresTitle}>
                Built For Member Independence
              </h2>
              <p className={styles.featuresSubtitle}>
                Everything you need to manage your gym membership without front desk delays.
              </p>
            </div>

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
                    >
                      {item.linkText}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        </main>
        </>
      )}

      {/* Site Footer */}
      <Footer onSelectView={handleSelectView} />
    </div>
  );
}
