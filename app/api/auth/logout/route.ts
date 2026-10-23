import { NextResponse } from 'next/server';
import { clearMemberSession } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearMemberSession();
  return NextResponse.json({ success: true });
}
