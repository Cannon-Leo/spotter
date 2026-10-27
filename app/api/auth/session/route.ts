import { NextResponse } from 'next/server';
import { clearMemberSession, getMemberSession } from '@/server/auth/session';
import { getMemberProfile } from '@/server/private/member';

export const dynamic = 'force-dynamic';

/**
 * Returns the signed in member's own status. Every field comes from the member
 * row read through the private module by the session member ID. When the row
 * is gone, the session is revoked instead of inventing a member.
 */
export async function GET() {
  try {
    const session = await getMemberSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, member: null });
    }

    const profile = await getMemberProfile(session.memberId);

    if (!profile) {
      await clearMemberSession();
      return NextResponse.json({ authenticated: false, member: null });
    }

    return NextResponse.json({
      authenticated: true,
      member: {
        id: profile.id,
        memberNumber: profile.memberNumber,
        name: profile.fullName,
        email: profile.email ?? null,
        effectiveTier: profile.effectiveTier,
        membershipStatus: profile.membershipStatus,
        lastActiveAt: session.lastActiveAt,
      },
    });
  } catch (err) {
    console.error('[api/auth/session] session read failed:', err);
    return NextResponse.json(
      { authenticated: false, member: null, error: 'Session unavailable.' },
      { status: 500 }
    );
  }
}
