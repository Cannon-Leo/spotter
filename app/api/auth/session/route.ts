import { NextResponse } from 'next/server';
import { getMemberSession } from '@/server/auth/session';

export async function GET() {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, member: null });
  }

  return NextResponse.json({
    authenticated: true,
    member: {
      id: session.memberId,
      effectiveTier: session.effectiveTier,
      lastActiveAt: session.lastActiveAt,
    },
  });
}
