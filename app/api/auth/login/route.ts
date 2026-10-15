import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession, getMemberSession } from '@/server/auth/session';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
      return NextResponse.json(
        { error: 'Enter your 4-digit PIN.' },
        { status: 400 }
      );
    }

    // Check if an existing session is already in cookies
    const currentSession = await getMemberSession();
    const memberId = currentSession ? currentSession.memberId : `mem_${crypto.randomBytes(6).toString('hex')}`;
    const deviceId = currentSession ? currentSession.deviceId : `dev_${crypto.randomBytes(6).toString('hex')}`;
    const effectiveTier = currentSession ? currentSession.effectiveTier : 'Basic';

    // Refresh session on successful PIN entry
    await setMemberSession({
      memberId,
      effectiveTier,
      deviceId,
      createdAt: currentSession ? currentSession.createdAt : Date.now(),
      lastActiveAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      member: {
        id: memberId,
        effectiveTier,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign in.' },
      { status: 500 }
    );
  }
}

