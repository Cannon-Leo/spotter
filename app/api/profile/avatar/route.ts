import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/server/auth/session';
import { getMemberAvatar, saveMemberAvatar } from '@/server/private/profile';

export const dynamic = 'force-dynamic';

/** Roughly 2 MB of image once base64 has expanded it. Checked before decoding. */
const MAX_DATA_URL_LENGTH = 4 * 1024 * 1024;

/**
 * Serves the signed in member's own picture.
 *
 * There is no public URL and no ID in the path: the bytes are always looked up
 * by the session member ID, so one member can never read another's picture.
 */
export async function GET() {
  try {
    const session = await getMemberSession();

    if (!session) {
      return new NextResponse(null, { status: 401 });
    }

    const avatar = await getMemberAvatar(session.memberId);

    if (!avatar) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(avatar.data), {
      status: 200,
      headers: {
        'Content-Type': avatar.mimeType,
        'Content-Length': String(avatar.data.length),
        // Private to this browser, never cached by a shared proxy.
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[api/profile/avatar] read failed:', err);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * Stores a new picture for the signed in member.
 *
 * The browser has already downscaled it to 512 px. The declared type is checked
 * against the actual first bytes in saveMemberAvatar, and anything over 2 MB is
 * refused before it reaches the database.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getMemberSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Sign in again to change your picture.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Send the picture as JSON.' }, { status: 400 });
    }

    const dataUrl = (body as { dataUrl?: unknown } | null)?.dataUrl;

    if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
      return NextResponse.json({ error: 'Choose a picture first.' }, { status: 400 });
    }
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      return NextResponse.json(
        { error: 'That picture is larger than 2 MB. Choose a smaller one.' },
        { status: 413 }
      );
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
    if (!match) {
      return NextResponse.json({ error: 'Use a JPEG, PNG or WebP picture.' }, { status: 400 });
    }

    const [, mimeType, base64] = match;
    const data = Buffer.from(base64.replace(/\s+/g, ''), 'base64');

    const result = await saveMemberAvatar(session.memberId, { mimeType, data });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      member: {
        hasAvatar: true,
        avatarUrl: `/api/profile/avatar?v=${Date.parse(result.avatarUpdatedAt)}`,
      },
    });
  } catch (err) {
    console.error('[api/profile/avatar] save failed:', err);
    return NextResponse.json(
      { error: 'We could not save that picture just now. Try again.' },
      { status: 500 }
    );
  }
}
