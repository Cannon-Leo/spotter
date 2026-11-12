import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/server/auth/session';
import { updateMemberName } from '@/server/private/profile';

export const dynamic = 'force-dynamic';

/**
 * Sets the signed in member's own full name.
 *
 * The member ID always comes from the session (FR-15). The body may only carry
 * a name; any id it tries to send is ignored. The four changes per two month
 * limit is enforced by updateMemberName, not by the browser.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getMemberSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Sign in again to change your profile.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Send the new name as JSON.' }, { status: 400 });
    }

    const fullName = (body as { fullName?: unknown } | null)?.fullName;
    const result = await updateMemberName(session.memberId, fullName);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          nameChangesUsed: result.nameChangesUsed ?? null,
          nameChangesRemaining: result.nameChangesRemaining ?? null,
          nameChangeWindowEndsAt: result.nameChangeWindowEndsAt ?? null,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      member: {
        name: result.fullName,
        firstName: result.firstName,
        lastName: result.lastName,
        profileCompleted: true,
        nameChangesUsed: result.nameChangesUsed,
        nameChangesRemaining: result.nameChangesRemaining,
        nameChangeWindowEndsAt: result.nameChangeWindowEndsAt,
      },
      countedAsChange: result.countedAsChange,
    });
  } catch (err) {
    console.error('[api/profile] name update failed:', err);
    return NextResponse.json(
      { error: 'We could not save that name just now. Try again.' },
      { status: 500 }
    );
  }
}
