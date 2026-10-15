import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, pin, deviceId } = body;

    // Validate 8-character uppercase alphanumeric code (PRD FR-1)
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'That code is not valid. Ask the front desk for a new one.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length !== 8) {
      return NextResponse.json(
        { error: 'That code is not valid. Ask the front desk for a new one.' },
        { status: 400 }
      );
    }

    // Validate 4-digit PIN (PRD FR-3)
    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 numeric digits.' },
        { status: 400 }
      );
    }

    // Generate member ID & device binding
    const memberId = `mem_${crypto.randomBytes(6).toString('hex')}`;
    const boundDeviceId = deviceId || `dev_${crypto.randomBytes(6).toString('hex')}`;

    // Issue session cookie
    await setMemberSession({
      memberId,
      effectiveTier: 'Basic',
      deviceId: boundDeviceId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      member: {
        id: memberId,
        effectiveTier: 'Basic',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred during activation.' },
      { status: 500 }
    );
  }
}

