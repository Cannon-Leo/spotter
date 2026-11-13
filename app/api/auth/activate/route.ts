import { NextRequest, NextResponse, after } from 'next/server';
import { setMemberSession } from '@/server/auth/session';
import { activateMember } from '@/server/membership/member';
import { sendWelcomeEmail } from '@/server/mail/mailer';
import { activateSchema, formatZodError } from '@/server/validation/schemas';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * FR-1 to FR-4. The browser sends the one time activation code issued by the
 * desk, the privacy acceptance, the chosen four digit PIN and the device ID.
 * Input is strictly validated by Zod before processing.
 * The member row already exists; this endpoint never creates one.
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

    const parsed = activateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { code, pin, privacyAccepted, email, fullName, deviceId } = parsed.data;

    const boundDeviceId =
      typeof deviceId === 'string' && deviceId.trim()
        ? deviceId.trim()
        : `dev_${crypto.randomBytes(12).toString('hex')}`;

    const result = await activateMember({
      code,
      pin,
      privacyAccepted,
      email,
      fullName,
      deviceId: boundDeviceId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await setMemberSession({ memberId: result.member.id, deviceId: boundDeviceId });

    /*
     * The welcome email is scheduled with after(), so it runs once the response
     * has been sent. A slow or misconfigured SMTP server therefore cannot delay
     * activation, and a failure cannot roll back an account that already exists.
     * Nothing about the member is logged here: the address and body are her data.
     */
    const welcomeTo = result.member.email?.trim();
    if (welcomeTo) {
      const welcomeMemberNumber = result.member.memberNumber;
      after(async () => {
        try {
          await sendWelcomeEmail({
            to: welcomeTo,
            memberNumber: welcomeMemberNumber,
          });
          console.log('[api/auth/activate] welcome email dispatched');
        } catch (err) {
          console.error(
            '[api/auth/activate] welcome email failed (activation unaffected):',
            err instanceof Error ? err.message : String(err)
          );
        }
      });
    } else {
      console.warn('[api/auth/activate] no email address on file, welcome email skipped');
    }

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
