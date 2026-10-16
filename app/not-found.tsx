import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backgroundColor: 'var(--color-surface-container-lowest)', color: 'var(--color-on-background)' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--color-on-surface-variant)' }}>The page you are looking for does not exist.</p>
      <Link href="/" style={{ color: 'var(--color-secondary)', textDecoration: 'underline', fontWeight: 600 }}>
        Return to Spotter Home
      </Link>
    </div>
  );
}

