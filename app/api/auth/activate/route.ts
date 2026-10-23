import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import { registerMember } from '@/server/membership/member';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, code, pin, deviceId } = body;

    // TEMPORARY: the member number is assumed to have been issued by the front
    // desk. It cannot be checked against an issuance record until the staff and
    // admin app that issues numbers exists, so any correctly formatted number is
    // accepted. When that app exists, or when instructed, restore the FR-1
    // activation code check.
    const memberNumber = typeof code === 'string' ? code.trim() : '';
    if (!/^\d{6}$/.test(memberNumber)) {
      return NextResponse.json(
        { error: 'Enter the 6-digit member number issued by the front desk.' },
        { status: 400 }
      );
    }

    // Validate password / PIN (min 4 characters)
    if (!pin || typeof pin !== 'string' || pin.trim().length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    const boundDeviceId = deviceId || `dev_${crypto.randomBytes(6).toString('hex')}`;
    const cleanEmail = typeof email === 'string' && email.trim() ? email.trim() : 'jbrendan86@gmail.com';
    const cleanName = typeof name === 'string' && name.trim() ? name.trim() : 'Joseph Brendan';

    // Register or update member in PostgreSQL database
    const memberRecord = await registerMember({
      fullName: cleanName,
      email: cleanEmail,
      memberNumber,
      pin,
      deviceId: boundDeviceId,
    });

    // Issue session cookie
    await setMemberSession({
      memberId: memberRecord.id,
      memberNumber: memberRecord.memberNumber,
      name: memberRecord.fullName,
      email: cleanEmail,
      effectiveTier: memberRecord.effectiveTier,
      deviceId: boundDeviceId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      member: {
        id: memberRecord.id,
        memberNumber: memberRecord.memberNumber,
        name: memberRecord.fullName,
        email: cleanEmail,
        effectiveTier: memberRecord.effectiveTier,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred during activation.' },
      { status: 500 }
    );
  }
}

