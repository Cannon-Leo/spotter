import { redirect } from 'next/navigation';

interface LoginRedirectProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

/**
 * Legacy entry point. The sign-in form now lives on the consolidated auth page,
 * so old links and bookmarks are forwarded with their redirect hint intact.
 */
export default async function LoginRedirect({ searchParams }: LoginRedirectProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect;

  redirect(
    raw
      ? `/auth?view=login&redirect=${encodeURIComponent(raw)}`
      : '/auth?view=login'
  );
}
