import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeToggle from '../theme-toggle';
import Footer from '../footer';
import StripedBackground from '../striped-background';
import styles from '../auth.module.css';
import LoginForm from './login-form';
import CreateAccountForm from './create-account-form';
import ResetPasswordView from './reset-password-view';
import { parseAuthView, type AuthView } from './view';

interface AuthPageProps {
  searchParams: { view?: string | string[] };
}

const VIEW_META: Record<AuthView, { title: string; description: string }> = {
  login: {
    title: 'Member Log In',
    description: 'Log in to your Spotter member account.',
  },
  'create-account': {
    title: 'Create Member Account',
    description: 'Activate your Spotter member account with the code issued by the front desk.',
  },
  'reset-password': {
    title: 'Reset Password / PIN',
    description: 'How to reset your 4-digit security PIN for your Spotter account.',
  },
};

export async function generateMetadata({ searchParams }: AuthPageProps): Promise<Metadata> {
  const view = parseAuthView(searchParams.view);
  return {
    title: VIEW_META[view].title,
    description: VIEW_META[view].description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  const view = parseAuthView(searchParams.view);
  const isReset = view === 'reset-password';

  return (
    <div className={styles.authPageRoot}>
      <StripedBackground variant="subtle" />

      <div className={`${styles.authContainer} ${isReset ? styles.authContainerWide : ''}`}>
        {/* Shared top bar across every auth view */}
        <div className={styles.authTopBar}>
          <Link
            href={isReset ? '/auth?view=login' : '/'}
            className={styles.backLink}
            aria-label={isReset ? 'Back to Log In' : 'Back to Spotter Home'}
          >
            &larr; {isReset ? 'Back to Log In' : 'Back to Spotter'}
          </Link>
          <span className={styles.authTopBarMeta}>
            <span className={styles.topBarBadge}>
              {isReset ? 'Security & PIN Reset' : 'Official Member App'}
            </span>
            <ThemeToggle />
          </span>
        </div>

        {/* One form at a time, chosen from the requested view */}
        {view === 'login' && <LoginForm />}
        {view === 'create-account' && <CreateAccountForm />}
        {view === 'reset-password' && <ResetPasswordView />}
      </div>

      {isReset && <Footer />}
    </div>
  );
}
