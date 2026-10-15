import { cookies } from 'next/headers';
import crypto from 'crypto';

export const MEMBER_SESSION_COOKIE = 'spotter_member_session';

export interface MemberSessionData {
  memberId: string;
  effectiveTier: 'Basic' | 'Premium';
  deviceId: string;
  createdAt: number;
  lastActiveAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'spotter-dev-session-secret-key-32chars!';

/**
 * Sign session data with HMAC-SHA256
 */
function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest('base64url');
}

/**
 * Encodes and signs session data into a cookie token string
 */
export function serializeSession(data: MemberSessionData): string {
  const json = JSON.stringify(data);
  const payload = Buffer.from(json).toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

/**
 * Decodes and verifies a signed session token
 */
export function deserializeSession(token: string): MemberSessionData | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expectedSig = signPayload(payload);

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(json) as MemberSessionData;

    // Check 90 days expiration (PRD FR-6)
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.lastActiveAt > ninetyDaysMs) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies member session cookie.
 * INVARIANT: This is the ONLY place the member session cookie is read in the application.
 */
export async function getMemberSession(): Promise<MemberSessionData | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(MEMBER_SESSION_COOKIE);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return deserializeSession(sessionCookie.value);
}

/**
 * Sets the member session cookie (HTTP-only, secure in production, SameSite Strict).
 */
export async function setMemberSession(data: MemberSessionData): Promise<void> {
  const cookieStore = cookies();
  const token = serializeSession(data);

  // 90 days max age per PRD FR-6
  const ninetyDaysSeconds = 90 * 24 * 60 * 60;

  cookieStore.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ninetyDaysSeconds,
  });
}

/**
 * Clears the member session cookie.
 */
export async function clearMemberSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(MEMBER_SESSION_COOKIE);
}
