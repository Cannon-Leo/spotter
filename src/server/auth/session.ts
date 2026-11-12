import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '../db/client';

export const MEMBER_SESSION_COOKIE = 'spotter_member_session';

/**
 * What callers are allowed to know about a session. Member identity data
 * (name, member number, tier) is NOT carried here: it is read from the
 * member row by the private module using this memberId, so a forged or
 * stale cookie can never invent a fact.
 */
export interface MemberSessionData {
  memberId: string;
  deviceId: string;
  createdAt: number;
  lastActiveAt: number;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;
const TOKEN_BYTES = 32;

/**
 * FR-6: the signing key is required. A missing key must fail loudly instead
 * of falling back to a value that is published in this repository.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or shorter than 32 characters. Refusing to sign member sessions.'
    );
  }
  return secret.trim();
}

function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payload);
  return hmac.digest('base64url');
}

/** Cookie value is the signed opaque session token. No member data is stored client side. */
function serializeToken(token: string): string {
  const payload = Buffer.from(token, 'utf8').toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

function deserializeToken(value: string): string | null {
  try {
    const parts = value.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = signPayload(payload);
    const given = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (given.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(given, expectedBuffer)) return null;

    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

/** Only the hash of a session token is ever stored (see MemberSession.tokenHash). */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function readSessionCookieValue(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(MEMBER_SESSION_COOKIE);
  return cookie?.value || null;
}

async function writeSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(MEMBER_SESSION_COOKIE, serializeToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: NINETY_DAYS_SECONDS,
  });
}

/**
 * FR-4: creates the session row and binds it to one device. Any session the
 * member already holds is revoked first, so a member never holds two active
 * sessions.
 */
export async function setMemberSession(params: {
  memberId: string;
  deviceId: string;
}): Promise<void> {
  const now = new Date();

  await prisma.memberSession.updateMany({
    where: { memberId: params.memberId, revokedAt: null },
    data: { revokedAt: now },
  });

  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');

  await prisma.memberSession.create({
    data: {
      memberId: params.memberId,
      tokenHash: hashToken(token),
      deviceId: params.deviceId,
      lastSeenAt: now,
    },
  });

  await prisma.member.update({
    where: { id: params.memberId },
    data: { deviceId: params.deviceId },
  });

  await writeSessionCookie(token);
}

/**
 * Reads and verifies the member session cookie.
 * INVARIANT (FR-15): this is the ONLY place the member session cookie is read.
 *
 * FR-4: the session must exist in the database and not be revoked.
 * FR-6: the session dies ninety days after last use, and requires the PIN
 * again after seven days without a request.
 */
export async function getMemberSession(): Promise<MemberSessionData | null> {
  const cookieValue = await readSessionCookieValue();
  if (!cookieValue) return null;

  const token = deserializeToken(cookieValue);
  if (!token) return null;

  const row = await prisma.memberSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!row || row.revokedAt) return null;

  const now = Date.now();
  const lastSeen = row.lastSeenAt.getTime();

  if (now - lastSeen > NINETY_DAYS_MS) return null;
  if (now - lastSeen > SEVEN_DAYS_MS) return null;

  await prisma.memberSession.update({
    where: { id: row.id },
    data: { lastSeenAt: new Date(now) },
  });

  // Refresh the cookie lifetime so the ninety days count from last use.
  try {
    await writeSessionCookie(token);
  } catch {
    // cookies() is read only outside a route handler or server action; the
    // database row above is still refreshed, which is what enforces FR-6.
  }

  return {
    memberId: row.memberId,
    deviceId: row.deviceId,
    createdAt: row.createdAt.getTime(),
    lastActiveAt: now,
  };
}

/** Revokes the session in the database and clears the cookie. */
export async function clearMemberSession(): Promise<void> {
  const cookieValue = await readSessionCookieValue();

  if (cookieValue) {
    const token = deserializeToken(cookieValue);
    if (token) {
      await prisma.memberSession.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  const store = await cookies();
  store.delete(MEMBER_SESSION_COOKIE);
}
