import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import { authenticateMember } from '@/server/membership/member';
import { formatZodError, loginSchema } from '@/server/validation/schemas';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * FR-6, FR-7. A member signs in with her member number (or the email the desk
 * recorded) and her four digit PIN. Validated with Zod before authentication.
 * Nothing is issued when the PIN is wrong: there is no fallback member and no
 * fabricated session.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { identifier: loginIdentifier, pin, deviceId } = parsed.data;

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
