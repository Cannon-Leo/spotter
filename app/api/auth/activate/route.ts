import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import { activateMember } from '@/server/membership/member';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * FR-1 to FR-4. The browser sends the one time activation code issued by the
 * desk, the privacy acceptance, the chosen four digit PIN and the device ID.
 * The member row already exists; this endpoint never creates one.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, pin, privacyAccepted, email, fullName, deviceId } = body ?? {};

    if (privacyAccepted !== true) {
      return NextResponse.json(
        { error: 'Accept the privacy notice before setting your PIN.' },
        { status: 400 }
      );
    }

    const boundDeviceId =
      typeof deviceId === 'string' && deviceId.trim()
        ? deviceId.trim()
        : `dev_${crypto.randomBytes(12).toString('hex')}`;

    const result = await activateMember({
      code,
      pin,
      privacyAccepted,
      email: typeof email === 'string' ? email : undefined,
      fullName: typeof fullName === 'string' ? fullName : undefined,
      deviceId: boundDeviceId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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
    console.error('[api/auth/activate] activation failed:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during activation.' },
      { status: 500 }
    );
  }
}
