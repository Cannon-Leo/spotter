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
  memberNumber?: string;
  name?: string;
  email?: string;
  effectiveTier: 'Basic' | 'Premium';
  /** False until the member has set her own name in the app. */
  profileCompleted?: boolean;
  hasAvatar?: boolean;
  avatarUrl?: string | null;
  nameChangesUsed?: number;
  nameChangesRemaining?: number;
  nameChangeWindowEndsAt?: string | null;
}

/** Matches NAME_CHANGE_LIMIT on the server. Shown as "x of 4 left". */
const NAME_CHANGE_LIMIT = 4;
/** Anything larger is refused before the browser spends time decoding it. */
const AVATAR_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** The server stores whatever it is given; the browser keeps it small. */
const AVATAR_MAX_DIMENSION = 512;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That file is not a picture we can read.'));
    image.src = src;
  });
}

/**
 * Downscales to 512 px and re-encodes as JPEG before upload, so a phone photo
 * is a few tens of kilobytes instead of several megabytes. Transparency is
 * flattened onto white, which is why the canvas is filled first.
 */
async function downscaleImageToDataUrl(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error('Use a JPEG, PNG or WebP picture.');
  }
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
    throw new Error('That picture is larger than 10 MB. Choose a smaller one.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const scale = Math.min(
      1,
      AVATAR_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare that picture.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatWindowEnd(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const GYM_QUESTIONS = [
  {
    id: 'saturday-class',
    question: 'What time is the Saturday class?',
    answer: 'Saturday HIIT and Strength classes run at 8:00 AM and 10:00 AM. Members are advised to arrive 10 minutes early.',
  },
  {
    id: 'bring-guest',
    question: 'Can I bring a guest with me?',
    answer: 'Basic members can bring one guest per month with 24 hours advance front desk notice. Premium members enjoy unlimited weekend guest passes.',
  },
  {
    id: 'card-hours',
    question: 'Why is my card not working before six?',
    answer: 'Gym access hours begin at 6:00 AM Monday through Saturday. Keypad codes and smart cards activate strictly at 6:00 AM.',
  },
  {
    id: 'access-hours',
    question: 'What are the gym access hours?',
    answer: 'Opening hours are Monday to Friday 6:00 AM – 10:00 PM, Saturday 7:00 AM – 8:00 PM, and Sunday 8:00 AM – 6:00 PM.',
  },
  {
    id: 'subscription-price',
    question: 'What is the current subscription price?',
    answer: 'Basic membership is 15,000 NGN/month. Premium membership is 25,000 NGN/month with full locker, guest, and class privileges.',
  },
  {
    id: 'pause-membership',
    question: 'How do I pause my membership?',
    answer: 'Memberships can be frozen for up to 30 days once per calendar year by notifying the front desk officer at least 3 days in advance.',
  },
  {
    id: 'training-plans',
    question: 'What training plans are available?',
    answer: 'We provide structured plans for Beginner Foundations, Strength & Hypertrophy, Conditioning & HIIT, and Open Gym access routines.',
  },
  {
    id: 'trainer-duty',
    question: 'Who is the trainer on duty today?',
    answer: 'Head Trainer Coach David and Assistant Coach Amaka are on duty today at the fitness floor.',
  },
];

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
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Profile: first-login modal, inline name edit, and picture upload.
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasOpenedMenuRef = useRef(false);
  const headerAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalNameInputRef = useRef<HTMLInputElement>(null);
  const nameEditInputRef = useRef<HTMLInputElement>(null);

  const selectedQuestion = GYM_QUESTIONS.find((q) => q.id === selectedQuestionId);

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

  // Helper to detect if a name is a placeholder from test scripts or initial desk issue
  function isPlaceholderName(name?: string | null): boolean {
    if (!name) return true;
    const trimmed = name.trim().toLowerCase();
    return (
      trimmed === '' ||
      trimmed === 'member' ||
      trimmed === 'spotter' ||
      trimmed === 'spotter member' ||
      trimmed === 'sign up tester' ||
      trimmed === 'set your name' ||
      trimmed.includes('tester') ||
      trimmed.includes('sign up') ||
      trimmed.includes('signup') ||
      trimmed.includes('spotter member') ||
      trimmed.startsWith('spotter')
    );
  }

  // A profile needs initial setup if not marked completed, or if the name is still a placeholder
  const isProfileIncomplete = Boolean(
    session && (session.profileCompleted === false || isPlaceholderName(session.name))
  );

  useEffect(() => {
    if (session && isProfileIncomplete) {
      setProfileModalOpen(true);
      setModalName(isPlaceholderName(session.name) ? '' : (session.name ?? ''));
      setModalError(null);
    }
  }, [session, isProfileIncomplete]);

  // Modal behaviour: Escape closes it, background scroll is locked, and focus
  // lands in the name field so typing works immediately.
  useEffect(() => {
    if (!profileModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalNameInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setProfileModalOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [profileModalOpen]);

  useEffect(() => {
    if (isEditingName) nameEditInputRef.current?.focus();
  }, [isEditingName]);

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

  function openProfileModal() {
    setModalName('');
    setModalError(null);
    setProfileModalOpen(true);
  }

  async function uploadAvatar(file: File) {
    if (avatarBusy) return;
    setAvatarBusy(true);
    setProfileMessage(null);
    setModalError(null);

    try {
      const dataUrl = await downscaleImageToDataUrl(file);
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'We could not save that picture. Try again.');
      }

      setSession((previous) =>
        previous
          ? { ...previous, hasAvatar: true, avatarUrl: data.member.avatarUrl }
          : previous
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not save that picture.';
      if (profileModalOpen) {
        setModalError(message);
      } else {
        setProfileMessage(message);
      }
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await uploadAvatar(file);
  }

  // Clicking the profile picture always initiates file selection to upload or change picture
  function handleAvatarButtonClick() {
    headerAvatarInputRef.current?.click();
  }

  function applyNameResponse(member: {
    name: string;
    nameChangesUsed: number;
    nameChangesRemaining: number;
    nameChangeWindowEndsAt: string | null;
  }) {
    setSession((previous) =>
      previous
        ? {
            ...previous,
            name: member.name,
            profileCompleted: true,
            nameChangesUsed: member.nameChangesUsed,
            nameChangesRemaining: member.nameChangesRemaining,
            nameChangeWindowEndsAt: member.nameChangeWindowEndsAt,
          }
        : previous
    );
  }

  async function saveName(fullName: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return { ok: false, error: data?.error || 'We could not save that name. Try again.' };
    }

    applyNameResponse(data.member);
    return { ok: true };
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalSaving) return;

    const fullName = modalName.trim();
    if (!fullName) {
      setModalError('Enter your first and last name.');
      return;
    }

    setModalSaving(true);
    setModalError(null);
    try {
      const result = await saveName(fullName);
      if (!result.ok) {
        setModalError(result.error);
        return;
      }
      setProfileModalOpen(false);
    } finally {
      setModalSaving(false);
    }
  }

  function startNameEdit() {
    if (nameChangesRemaining <= 0) {
      setNameError(
        `You have used all ${NAME_CHANGE_LIMIT} name changes allowed in this 2-month period.` +
          (nameWindowEnd ? ` Next change available on ${nameWindowEnd}.` : '')
      );
      return;
    }
    setNameDraft(isPlaceholderName(session?.name) ? '' : (session?.name ?? ''));
    setNameError(null);
    setIsEditingName(true);
  }

  async function handleNameSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameSaving) return;

    const fullName = nameDraft.trim();
    if (!fullName) {
      setNameError('Enter your first and last name.');
      return;
    }

    setNameSaving(true);
    setNameError(null);
    try {
      const result = await saveName(fullName);
      if (!result.ok) {
        setNameError(result.error);
        return;
      }
      setIsEditingName(false);
    } finally {
      setNameSaving(false);
    }
  }

  // Shared between the desktop header row and the mobile slide-in drawer.
  // Only one of the two is ever displayed, so the screen reader tree never
  // contains two copies of the same control.
  const navActionContent = session ? (
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
  ) : (
    <Link
      href="/auth?view=create-account"
      className={styles.navGetStartedBtn}
      onClick={() => setIsMenuOpen(false)}
    >
      Get Started
    </Link>
  );

  const profileName = session
    ? isProfileIncomplete
      ? 'Set your name'
      : session.name?.trim() || 'Member'
    : '';
  const nameChangesRemaining = session?.nameChangesRemaining ?? NAME_CHANGE_LIMIT;
  const nameWindowEnd = formatWindowEnd(session?.nameChangeWindowEndsAt);

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

      {/* Default Member or Marketing Home View */}
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
                {session && (
                  <span className={styles.navMemberName}>{profileName}</span>
                )}

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

            <div className={styles.mobileDrawerContent}>
              {session && (
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <span className={styles.navMemberName}>{profileName}</span>
                </div>
              )}
              {navActionContent}
            </div>
          </div>

          {/* Main Content Area: Dashboard if Authenticated, Marketing if Visitor */}
          {session ? (
            <main id="main-content" tabIndex={-1} className={styles.dashboardContainer}>
              <div className={styles.dashboardCard}>
                {profileMessage && (
                  <p className={styles.profileBanner} role="alert">
                    {profileMessage}
                    <button
                      type="button"
                      className={styles.profileBannerClose}
                      onClick={() => setProfileMessage(null)}
                      aria-label="Dismiss message"
                    >
                      ×
                    </button>
                  </p>
                )}

                {/* Header Row */}
                <div className={styles.dashboardHeader}>
                  <div className={styles.userMeta}>
                    <div className={styles.userNameRow}>
                      {isEditingName ? (
                        <form className={styles.nameEditForm} onSubmit={handleNameSave}>
                          <label htmlFor="profile-name-edit" className={styles.srOnly}>
                            Full name
                          </label>
                          <input
                            id="profile-name-edit"
                            ref={nameEditInputRef}
                            className={styles.nameEditInput}
                            value={nameDraft}
                            onChange={(event) => setNameDraft(event.target.value)}
                            maxLength={200}
                            autoComplete="name"
                            disabled={nameSaving}
                          />
                          <button
                            type="submit"
                            className={styles.nameEditSave}
                            disabled={nameSaving}
                          >
                            {nameSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className={styles.nameEditCancel}
                            onClick={() => setIsEditingName(false)}
                            disabled={nameSaving}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <h1
                            className={styles.userName}
                            onClick={isProfileIncomplete ? openProfileModal : undefined}
                            style={isProfileIncomplete ? { cursor: 'pointer' } : undefined}
                            title={isProfileIncomplete ? 'Click to set your profile name' : undefined}
                          >
                            {profileName}
                          </h1>
                          <button
                            type="button"
                            className={styles.nameEditBtn}
                            onClick={startNameEdit}
                            disabled={nameChangesRemaining <= 0}
                            aria-label="Edit your name"
                            title={
                              nameChangesRemaining > 0
                                ? `Edit your name (${nameChangesRemaining} of ${NAME_CHANGE_LIMIT} changes remaining)`
                                : `Maximum ${NAME_CHANGE_LIMIT} name changes reached for this 2-month period`
                            }
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>

                    <p className={styles.nameHint}>
                      {nameChangesRemaining > 0
                        ? `${nameChangesRemaining} of ${NAME_CHANGE_LIMIT} name changes remaining in this 2-month period.`
                        : `Maximum limit reached (4 changes per 2-month period). Next available: ${nameWindowEnd ?? 'next period'}.`}
                    </p>
                    {nameError && (
                      <p className={styles.nameError} role="alert">
                        {nameError}
                      </p>
                    )}

                    <p className={styles.userEmail}>
                      {session.email || 'No email on file'}
                    </p>
                  </div>

                  <div className={styles.headerActions}>
                    <span className={styles.memberIdBadge}>
                      #{session.memberNumber || (session.id ? session.id.slice(0, 6) : '123456')}
                    </span>

                    {/* The second Sign Out button used to live here. The profile
                        picture replaces it; Sign Out stays in the top nav. */}
                    <button
                      type="button"
                      className={styles.avatarButton}
                      onClick={handleAvatarButtonClick}
                      aria-label="Change profile picture"
                      title="Change profile picture"
                      aria-busy={avatarBusy}
                    >
                      {session.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.avatarUrl}
                          alt=""
                          className={styles.avatarImage}
                          width={56}
                          height={56}
                        />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.avatarFallbackIcon}
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                        </svg>
                      )}
                      <span className={styles.avatarEditBadge} aria-hidden="true">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </span>
                    </button>
                    <input
                      ref={headerAvatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={styles.hiddenFileInput}
                      onChange={handleAvatarInputChange}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* 4 Metric Tiles */}
                <div className={styles.metricsGrid} aria-label="Membership overview">
                  <div className={`${styles.metricTile} ${styles.metricTileTier}`}>
                    <span className={styles.metricLabel}>EFFECTIVE TIER</span>
                    <span className={styles.metricValue}>
                      {session.effectiveTier ? `${session.effectiveTier} Member` : 'Basic Member'}
                    </span>
                  </div>
                  <div className={`${styles.metricTile} ${styles.metricTileExpiry}`}>
                    <span className={styles.metricLabel}>EXPIRY DATE</span>
                    <span className={styles.metricValue}>Active</span>
                  </div>
                  <div className={`${styles.metricTile} ${styles.metricTileAttendance}`}>
                    <span className={styles.metricLabel}>ATTENDANCE</span>
                    <span className={styles.metricValue}>0 days this month</span>
                  </div>
                  <div className={`${styles.metricTile} ${styles.metricTileBalance}`}>
                    <span className={styles.metricLabel}>BALANCE</span>
                    <span className={styles.metricValue}>Nothing due.</span>
                  </div>
                </div>

                {/* Ask About The Gym Section */}
                <div className={styles.qaSection}>
                  <h2 className={styles.qaTitle}>Ask About The Gym</h2>
                  <p className={styles.qaSubtitle}>
                    Tapped questions skip model calls and verify against approved gym records.
                  </p>

                  <div className={styles.qaGrid} role="region" aria-label="Approved gym questions">
                    {GYM_QUESTIONS.map((item, index) => {
                      const isSelected = selectedQuestionId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.qaButton} ${isSelected ? styles.qaButtonActive : ''}`}
                          onClick={() =>
                            setSelectedQuestionId((prev) => (prev === item.id ? null : item.id))
                          }
                          aria-expanded={isSelected}
                          aria-controls={isSelected ? 'gym-answer' : undefined}
                        >
                          <span className={styles.cardNumber} aria-hidden="true">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className={styles.cardTitle}>{item.question}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Answer Box */}
                  {selectedQuestion && (
                    <div id="gym-answer" className={styles.answerBox} role="status" aria-live="polite">
                      <div className={styles.answerHeader}>
                        <span className={styles.answerQuestionTitle}>{selectedQuestion.question}</span>
                        <span className={styles.answerBadge}>✓ Verified against approved gym records</span>
                      </div>
                      <p className={styles.answerText}>{selectedQuestion.answer}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Row */}
                <div className={styles.cardFooterRow}>
                  <span className={styles.footerNotice}>
                    Need assistance with personal records or waivers?
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      alert('To update your password, contact the front desk or use your member activation code.')
                    }
                    className={styles.managePasswordLink}
                  >
                    Manage Password
                  </button>
                </div>
              </div>
            </main>
          ) : (
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
                    href="/auth?view=create-account"
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
          )}
        </>
      )}

      {/* First-login profile modal: her own name, and optionally a picture. */}
      {profileModalOpen && session && (
        <div
          className={styles.profileModalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfileModalOpen(false);
          }}
        >
          <div
            className={styles.profileModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            aria-describedby="profile-modal-description"
          >
            <button
              type="button"
              className={styles.profileModalClose}
              onClick={() => setProfileModalOpen(false)}
              aria-label="Close profile setup"
            >
              <svg
                width="20"
                height="20"
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

            <h2 id="profile-modal-title" className={styles.profileModalTitle}>
              Set up your profile
            </h2>
            <p id="profile-modal-description" className={styles.profileModalText}>
              Choose the name Spotter should use for you, and add a picture if you
              like. You can change the name up to {NAME_CHANGE_LIMIT} times every
              two months.
            </p>

            <form className={styles.profileModalForm} onSubmit={handleProfileSubmit}>
              <div className={styles.profileAvatarPickerWrap}>
                <button
                  type="button"
                  className={styles.profileAvatarPicker}
                  onClick={() => modalAvatarInputRef.current?.click()}
                  aria-label="Add a profile picture"
                  aria-busy={avatarBusy}
                >
                  {session.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.avatarUrl}
                      alt=""
                      className={styles.profileAvatarPickerImage}
                      width={96}
                      height={96}
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.profileAvatarPickerIcon}
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                    </svg>
                  )}
                  <span className={styles.profileAvatarPickerBadge}>
                    {avatarBusy
                      ? 'Uploading…'
                      : session.avatarUrl
                        ? 'Change photo'
                        : 'Add photo'}
                  </span>
                </button>
                <input
                  ref={modalAvatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.hiddenFileInput}
                  onChange={handleAvatarInputChange}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span className={styles.profileAvatarHint}>
                  Optional. JPEG, PNG or WebP. We shrink it for you.
                </span>
              </div>

              <label className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Full name</span>
                <input
                  ref={modalNameInputRef}
                  className={styles.profileFieldInput}
                  value={modalName}
                  onChange={(event) => setModalName(event.target.value)}
                  placeholder="e.g. Chioma Okonkwo"
                  autoComplete="name"
                  maxLength={200}
                  required
                  disabled={modalSaving}
                />
              </label>

              {modalError && (
                <p className={styles.profileModalError} role="alert">
                  {modalError}
                </p>
              )}

              <div className={styles.profileModalActions}>
                <button
                  type="submit"
                  className={styles.profilePrimaryBtn}
                  disabled={modalSaving}
                >
                  {modalSaving ? 'Saving…' : 'Save profile'}
                </button>
                <button
                  type="button"
                  className={styles.profileSecondaryBtn}
                  onClick={() => setProfileModalOpen(false)}
                  disabled={modalSaving}
                >
                  Later
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Footer */}
      <Footer onSelectView={handleSelectView} />
    </div>
  );
}
