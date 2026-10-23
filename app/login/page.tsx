import { redirect } from 'next/navigation';

interface LoginRedirectProps {
  searchParams: { redirect?: string | string[] };
}

/**
 * Legacy entry point. The sign-in form now lives on the consolidated auth page,
 * so old links and bookmarks are forwarded with their redirect hint intact.
 */
export default function LoginRedirect({ searchParams }: LoginRedirectProps) {
  const raw = Array.isArray(searchParams.redirect)
    ? searchParams.redirect[0]
    : searchParams.redirect;

  redirect(
    raw
      ? `/auth?view=login&redirect=${encodeURIComponent(raw)}`
      : '/auth?view=login'
  );
}
