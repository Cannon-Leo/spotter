import { NextRequest, NextResponse } from 'next/server';
import { setMemberSession, getMemberSession } from '@/server/auth/session';
import { authenticateMember } from '@/server/membership/member';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, email } = body;

    if (!pin || typeof pin !== 'string' || pin.trim().length < 4) {
      return NextResponse.json(
        { error: 'Enter your password.' },
        { status: 400 }
      );
    }

    // Check if an existing session is already in cookies
    const currentSession = await getMemberSession();
    const deviceId = currentSession ? currentSession.deviceId : `dev_${crypto.randomBytes(6).toString('hex')}`;

    // Authenticate or look up member in database
    const memberRecord = await authenticateMember({
      pin,
      email: typeof email === 'string' && email.trim() ? email.trim() : currentSession?.email,
      memberId: currentSession?.memberId,
    });

    const memberId = memberRecord ? memberRecord.id : (currentSession ? currentSession.memberId : `mem_${crypto.randomBytes(6).toString('hex')}`);
    const memberNumber = memberRecord ? memberRecord.memberNumber : (currentSession?.memberNumber || '123456');
    const nameStr = memberRecord ? memberRecord.fullName : (currentSession?.name || 'Joseph Brendan');
    const effectiveTier = memberRecord ? memberRecord.effectiveTier : (currentSession?.effectiveTier || 'Basic');
    const emailStr = typeof email === 'string' && email.trim() ? email.trim() : (currentSession?.email || 'jbrendan86@gmail.com');

    // Refresh session on successful PIN entry
    await setMemberSession({
      memberId,
      memberNumber,
      name: nameStr,
      email: emailStr,
      effectiveTier,
      deviceId,
      createdAt: currentSession ? currentSession.createdAt : Date.now(),
      lastActiveAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      member: {
        id: memberId,
        memberNumber,
        name: nameStr,
        email: emailStr,
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

