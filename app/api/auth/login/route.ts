import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import { authenticateMember } from '@/server/membership/member';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * FR-6, FR-7. A member signs in with her member number (or the email the desk
 * recorded) and her four digit PIN. Nothing is issued when the PIN is wrong:
 * there is no fallback member and no fabricated session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, pin, deviceId } = body ?? {};

    // `email` is still accepted so an older client cannot break, but the
    // identifier is the only value used to find the member.
    const loginIdentifier =
      typeof identifier === 'string' && identifier.trim()
        ? identifier.trim()
        : typeof email === 'string'
          ? email.trim()
          : '';

    if (!loginIdentifier) {
      return NextResponse.json(
        { error: 'Enter your member number or email address.' },
        { status: 400 }
      );
    }

    if (typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
      return NextResponse.json({ error: 'Enter your four digit PIN.' }, { status: 400 });
    }

    const result = await authenticateMember({ identifier: loginIdentifier, pin });

    if (!result.ok) {
      if (result.reason === 'locked') {
        return NextResponse.json(
          {
            error:
              'Too many wrong PIN entries. Try again in fifteen minutes or ask the front desk.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'That member number or email and PIN do not match our records.' },
        { status: 401 }
      );
    }

    const boundDeviceId =
      typeof deviceId === 'string' && deviceId.trim()
        ? deviceId.trim()
        : `dev_${crypto.randomBytes(12).toString('hex')}`;

    await setMemberSession({ memberId: result.member.id, deviceId: boundDeviceId });

    return NextResponse.json({
      success: true,
      member: {
        id: result.member.id,
        memberNumber: result.member.memberNumber,
        name: result.member.fullName,
        email: result.member.email ?? null,
        effectiveTier: result.member.effectiveTier,
        membershipStatus: result.member.membershipStatus,
      },
    });
  } catch (err) {
    console.error('[api/auth/login] sign in failed:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign in.' },
      { status: 500 }
    );
  }
}
