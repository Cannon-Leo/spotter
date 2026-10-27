import { NextResponse } from 'next/server';
import { clearMemberSession } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

/** FR-4: revokes the session row as well as clearing the cookie. */
export async function POST() {
  try {
    await clearMemberSession();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/auth/logout] sign out failed:', err);
    return NextResponse.json({ error: 'Sign out failed.' }, { status: 500 });
  }
}
