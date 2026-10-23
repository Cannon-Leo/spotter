import { redirect } from 'next/navigation';

// A static redirect page only ships a client-side redirect payload in Next 14,
// so force server rendering to guarantee a real 307 with a Location header.
export const dynamic = 'force-dynamic';

/** Legacy entry point for the PIN reset guidance on the consolidated auth page. */
export default function ResetPasswordRedirect() {
  redirect('/auth?view=reset-password');
}
