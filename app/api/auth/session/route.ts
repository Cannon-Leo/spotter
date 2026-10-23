import { NextResponse } from 'next/server';
import { getMemberSession } from '@/server/auth/session';
import { getMemberProfile } from '@/server/private/member';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, member: null });
  }

  // Read private member record from database using session member ID
  let dbProfile = null;
  try {
    dbProfile = await getMemberProfile(session.memberId);
  } catch (err) {
    console.error('Failed to read member profile from DB:', err);
  }

  const memberNumber = dbProfile?.memberNumber || session.memberNumber || '123456';
  const name = dbProfile?.fullName || session.name || 'Joseph Brendan';
  const effectiveTier = dbProfile?.effectiveTier || session.effectiveTier || 'Basic';
  const email = session.email || 'jbrendan86@gmail.com';

  return NextResponse.json({
    authenticated: true,
    member: {
      id: session.memberId,
      memberNumber,
      name,
      email,
      effectiveTier,
      lastActiveAt: session.lastActiveAt,
    },
  });
}
