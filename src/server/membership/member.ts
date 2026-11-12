import { prisma } from '../db/client';
import crypto from 'crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { NAME_CHANGE_WINDOW_MS, summarizeNameChanges } from '../private/profile';

export interface MemberRecordDto {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  tier: 'BASIC' | 'PREMIUM';
  effectiveTier: 'Basic' | 'Premium';
  membershipStatus: MembershipStatus;
  joinedAt: Date;
  expiryDate: Date;
  /** True once the member has set her own name in the app. */
  profileCompleted: boolean;
  hasAvatar: boolean;
  avatarUpdatedAt?: Date;
  /** Name changes used inside the rolling two month window. */
  nameChangesUsed: number;
  nameChangesRemaining: number;
  /** When the next change is allowed, only when the limit is reached. */
  nameChangeWindowEndsAt?: Date;
}

export type MembershipStatus = 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';

export type ActivateResult =
  | { ok: true; member: MemberRecordDto }
  | { ok: false; error: string };

export type AuthenticateResult =
  | { ok: true; member: MemberRecordDto }
  | { ok: false; reason: 'invalid' | 'locked' };

const PIN_ATTEMPT_LIMIT = 5;
const PIN_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;
const PIN_LOCK_MS = 15 * 60 * 1000;
const PIN_HARD_LIMIT = 10;

/**
 * FR-3: Argon2id with the OWASP baseline parameters. @node-rs/argon2 defaults
 * to Argon2id; we never pass another algorithm, so every hash it writes has
 * the $argon2id$ prefix.
 */
const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPin(pin: string): Promise<string> {
  return argonHash(pin.trim(), ARGON_OPTIONS);
}

export function verifyPin(pinHash: string, pin: string): Promise<boolean> {
  return argonVerify(pinHash, pin.trim(), ARGON_OPTIONS);
}

/**
 * FR-1: activation codes are stored only as a hash. The hash is keyed with the
 * server secret so the value cannot be reversed from a database dump.
 *
 * The issuing script (scripts/issue-activation-code.js) computes the same
 * value; both must use this exact formula.
 */
export function hashActivationCode(code: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('SESSION_SECRET is missing or too short to hash activation codes.');
  }
  return crypto
    .createHmac('sha256', secret.trim())
    .update(code.trim().toUpperCase())
    .digest('hex');
}

/** YYYY-MM-DD in the gym's own timezone, so "today" means the gym's today. */
function gymDayKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** A @db.Date column is stored as midnight UTC, so its UTC parts are the date. */
function storedDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** FR-51: status is derived, never stored. */
export function effectiveStatus(
  member: { expiryDate: Date; cancelledAt: Date | null },
  gym: { graceDays: number; timezone: string },
  now: Date = new Date()
): MembershipStatus {
  if (member.cancelledAt) return 'CANCELLED';

  const today = gymDayKey(now, gym.timezone);
  const expiry = storedDayKey(member.expiryDate);
  const graceEnds = addDaysToKey(expiry, gym.graceDays);

  if (today <= expiry) return 'ACTIVE';
  if (today <= graceEnds) return 'GRACE';
  return 'EXPIRED';
}

/** FR-52: effective tier drops to BASIC once expired or cancelled. */
export function effectiveTier(
  member: { tier: 'BASIC' | 'PREMIUM'; expiryDate: Date; cancelledAt: Date | null },
  gym: { graceDays: number; timezone: string },
  now: Date = new Date()
): 'Basic' | 'Premium' {
  const status = effectiveStatus(member, gym, now);
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'Basic';
  return member.tier === 'PREMIUM' ? 'Premium' : 'Basic';
}

type MemberWithGym = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  tier: 'BASIC' | 'PREMIUM';
  joinedAt: Date;
  expiryDate: Date;
  cancelledAt: Date | null;
  gym: { graceDays: number; timezone: string };
  profileCompletedAt?: Date | null;
  avatarUpdatedAt?: Date | null;
  nameChanges?: { changedAt: Date }[];
};

export function toMemberRecord(member: MemberWithGym, now: Date = new Date()): MemberRecordDto {
  // Activation and login do not load name changes; the dashboard reads them
  // through getMemberProfile, which always does.
  const nameChanges = summarizeNameChanges(member.nameChanges ?? [], now);

  return {
    id: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    email: member.email || undefined,
    dateOfBirth: member.dateOfBirth ?? undefined,
    address: member.address || undefined,
    emergencyContactName: member.emergencyContactName || undefined,
    emergencyContactPhone: member.emergencyContactPhone || undefined,
    tier: member.tier,
    effectiveTier: effectiveTier(member, member.gym, now),
    membershipStatus: effectiveStatus(member, member.gym, now),
    joinedAt: member.joinedAt,
    expiryDate: member.expiryDate,
    profileCompleted: Boolean(member.profileCompletedAt),
    hasAvatar: Boolean(member.avatarUpdatedAt),
    avatarUpdatedAt: member.avatarUpdatedAt ?? undefined,
    nameChangesUsed: nameChanges.used,
    nameChangesRemaining: nameChanges.remaining,
    nameChangeWindowEndsAt: nameChanges.windowEndsAt ?? undefined,
  };
}

const EMAIL_MAX_LENGTH = 320;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Mirrors the CHECK constraint on Member.email in the database. */
function isValidEmail(value: string): boolean {
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value);
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Member';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function findGym() {
  // Single gym in version one. Every model still carries a gym ID.
  return prisma.gym.findFirst({ orderBy: { createdAt: 'asc' } });
}

/**
 * FR-1, FR-2, FR-3: activation is the only self service way to get a PIN.
 * The desk issues a one time eight character code; the member enters it,
 * accepts the privacy notice and sets a four digit PIN.
 *
 * The member row itself always exists before a code is issued, so activation
 * never creates a member and never accepts a name or number typed by the
 * browser as identity.
 */
export async function activateMember(params: {
  code: string;
  pin: string;
  privacyAccepted: boolean;
  email?: string;
  fullName?: string;
  deviceId?: string;
}): Promise<ActivateResult> {
  const invalidCode = 'That code is not valid. Ask the front desk for a new one.';

  if (!params.privacyAccepted) {
    return { ok: false, error: 'Accept the privacy notice before setting your PIN.' };
  }

  const code = typeof params.code === 'string' ? params.code.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{8}$/.test(code)) {
    console.warn('[auth/activate] rejected: code is not eight letters or digits');
    return { ok: false, error: invalidCode };
  }

  const pin = typeof params.pin === 'string' ? params.pin.trim() : '';
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'Your PIN must be exactly four digits.' };
  }

  let codeHash: string;
  try {
    codeHash = hashActivationCode(code);
  } catch {
    console.error('[auth/activate] rejected: SESSION_SECRET is unavailable, cannot hash the code');
    return { ok: false, error: invalidCode };
  }

  const issued = await prisma.activationCode.findUnique({
    where: { codeHash },
    include: { member: { include: { gym: true } } },
  });

  if (!issued) {
    console.warn('[auth/activate] rejected: no activation code matches this value');
    return { ok: false, error: invalidCode };
  }
  if (issued.usedAt) {
    console.warn('[auth/activate] rejected: code was already used at', issued.usedAt.toISOString());
    return { ok: false, error: invalidCode };
  }
  if (issued.expiresAt.getTime() <= Date.now()) {
    console.warn('[auth/activate] rejected: code expired at', issued.expiresAt.toISOString());
    return { ok: false, error: invalidCode };
  }
  if (issued.member.cancelledAt) {
    console.warn('[auth/activate] rejected: member is cancelled');
    return { ok: false, error: invalidCode };
  }

  const now = new Date();
  const pinHash = await hashPin(pin);
  const email =
    typeof params.email === 'string' && params.email.trim()
      ? normalizeEmail(params.email)
      : null;

  if (email && !isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address, or leave it blank.' };
  }

  const name =
    typeof params.fullName === 'string' && params.fullName.trim()
      ? splitFullName(params.fullName)
      : null;

  try {
    const member = await prisma.$transaction(async (tx) => {
      // Claim the code first: the conditional update makes a second use
      // impossible even if two requests arrive together.
      const claimed = await tx.activationCode.updateMany({
        where: { id: issued.id, usedAt: null },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return null;

      return tx.member.update({
        where: { id: issued.memberId },
        data: {
          pinHash,
          activatedAt: issued.member.activatedAt || now,
          privacyAcceptedAt: now,
          deviceId: params.deviceId,
          failedPinAttempts: 0,
          pinFailedWindowStart: null,
          pinLockedUntil: null,
          ...(email ? { email } : {}),
          ...(name ? { firstName: name.firstName, lastName: name.lastName } : {}),
        },
        include: { gym: true },
      });
    });

    if (!member) return { ok: false, error: invalidCode };

    return { ok: true, member: toMemberRecord(member) };
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return { ok: false, error: 'That email address is already linked to another member.' };
    }
    throw err;
  }
}

/**
 * FR-6, FR-7: the PIN is the only credential. Any failure returns a generic
 * message; the caller must never learn which part was wrong.
 */
export async function authenticateMember(params: {
  identifier: string;
  pin: string;
}): Promise<AuthenticateResult> {
  const identifier = typeof params.identifier === 'string' ? params.identifier.trim() : '';
  const pin = typeof params.pin === 'string' ? params.pin.trim() : '';

  if (!identifier || !/^\d{4}$/.test(pin)) {
    return { ok: false, reason: 'invalid' };
  }

  const gym = await findGym();
  if (!gym) return { ok: false, reason: 'invalid' };

  const member = identifier.includes('@')
    ? await prisma.member.findUnique({
        where: { gymId_email: { gymId: gym.id, email: normalizeEmail(identifier) } },
        include: { gym: true },
      })
    : await prisma.member.findUnique({
        where: { gymId_memberNumber: { gymId: gym.id, memberNumber: identifier } },
        include: { gym: true },
      });

  if (!member || member.cancelledAt || !member.pinHash) {
    return { ok: false, reason: 'invalid' };
  }

  const now = new Date();

  if (member.pinLockedUntil && member.pinLockedUntil.getTime() > now.getTime()) {
    return { ok: false, reason: 'locked' };
  }

  const correct = await verifyPin(member.pinHash, pin);

  if (!correct) {
    const windowStart = member.pinFailedWindowStart;
    const withinWindow =
      windowStart !== null && now.getTime() - windowStart.getTime() < PIN_ATTEMPT_WINDOW_MS;
    const attempts = (withinWindow ? member.failedPinAttempts : 0) + 1;
    const nextWindowStart = withinWindow ? windowStart : now;

    if (attempts >= PIN_HARD_LIMIT) {
      // FR-7: ten wrong entries in a day revoke the session and require a
      // fresh activation code from the desk.
      await prisma.$transaction([
        prisma.memberSession.updateMany({
          where: { memberId: member.id, revokedAt: null },
          data: { revokedAt: now },
        }),
        prisma.member.update({
          where: { id: member.id },
          data: {
            pinHash: null,
            failedPinAttempts: 0,
            pinFailedWindowStart: null,
            pinLockedUntil: null,
          },
        }),
      ]);
      return { ok: false, reason: 'invalid' };
    }

    const lock = attempts >= PIN_ATTEMPT_LIMIT;

    await prisma.member.update({
      where: { id: member.id },
      data: {
        failedPinAttempts: attempts,
        pinFailedWindowStart: nextWindowStart,
        pinLockedUntil: lock ? new Date(now.getTime() + PIN_LOCK_MS) : member.pinLockedUntil,
      },
    });

    return { ok: false, reason: lock ? 'locked' : 'invalid' };
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { failedPinAttempts: 0, pinFailedWindowStart: null, pinLockedUntil: null },
  });

  return { ok: true, member: toMemberRecord(member, now) };
}
