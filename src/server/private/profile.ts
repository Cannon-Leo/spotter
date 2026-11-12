import { prisma } from '../db/client';

/**
 * A member's own name and picture.
 *
 * INVARIANTS
 * - Every exported function takes the member ID from the server session as its
 *   first argument. Nothing here accepts an ID from a request body.
 * - Every read and every change writes a PrivateAccessLog row, exactly like the
 *   read paths in ./member.ts. An unaudited private access must not succeed.
 * - The name change limit is enforced here, on the server, from the NameChange
 *   table. The browser only ever sees how many changes are left; it can never
 *   grant itself another one.
 */

/** Four full name changes are allowed inside a rolling two month window. */
export const NAME_CHANGE_LIMIT = 4;
export const NAME_CHANGE_WINDOW_DAYS = 60;
export const NAME_CHANGE_WINDOW_MS = NAME_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * The browser downscales to 512 px before uploading, so these are hard outer
 * bounds, not the expected size. 2 MB of decoded image is already generous.
 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

export interface NameChangeSummary {
  used: number;
  remaining: number;
  /** When the next change becomes available, only when none are left. */
  windowEndsAt: Date | null;
}

/** Shared by the profile read path in ./member.ts and the write path below. */
export function summarizeNameChanges(
  changes: { changedAt: Date }[],
  now: Date = new Date()
): NameChangeSummary {
  const cutoff = now.getTime() - NAME_CHANGE_WINDOW_MS;
  const inWindow = changes
    .filter((change) => change.changedAt.getTime() > cutoff)
    .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  const used = inWindow.length;
  const remaining = Math.max(0, NAME_CHANGE_LIMIT - used);
  const windowEndsAt =
    remaining === 0
      ? new Date(inWindow[0].changedAt.getTime() + NAME_CHANGE_WINDOW_MS)
      : null;

  return { used, remaining, windowEndsAt };
}

export interface ParsedName {
  firstName: string;
  lastName: string;
  fullName: string;
}

/**
 * A name must have a first and a last part, because the database requires both
 * columns to be present and the member list is read back as "first last".
 * Middle names stay in the last name field; the display order is unchanged.
 */
export function parseFullName(
  raw: unknown
): { ok: true; name: ParsedName } | { ok: false; error: string } {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Enter your first and last name.' };
  }

  const fullName = raw.trim().replace(/\s+/g, ' ');
  if (fullName.length < 2) {
    return { ok: false, error: 'Enter your first and last name.' };
  }
  if (fullName.length > 200) {
    return { ok: false, error: 'That name is too long. Use 200 characters or fewer.' };
  }
  if (/[\u0000-\u001f<>]/.test(fullName)) {
    return { ok: false, error: 'That name contains characters we cannot store.' };
  }

  const parts = fullName.split(' ');
  if (parts.length < 2) {
    return { ok: false, error: 'Enter both your first name and your last name.' };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  if (firstName.length > 100 || lastName.length > 100) {
    return { ok: false, error: 'That name is too long for one of the name fields.' };
  }

  return { ok: true, name: { firstName, lastName, fullName } };
}

export type UpdateNameResult =
  | {
      ok: true;
      fullName: string;
      firstName: string;
      lastName: string;
      profileCompleted: true;
      countedAsChange: boolean;
      nameChangesUsed: number;
      nameChangesRemaining: number;
      nameChangeWindowEndsAt: string | null;
    }
  | {
      ok: false;
      status: 400 | 404 | 429;
      error: string;
      nameChangesUsed?: number;
      nameChangesRemaining?: number;
      nameChangeWindowEndsAt?: string | null;
    };

function formatLimitDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Sets the member's own full name.
 *
 * - The first successful save marks the profile complete, so the dashboard
 *   stops treating the desk placeholder as her name.
 * - Re-saving the same name is not a change and does not consume one of the
 *   four, which keeps a double submit harmless.
 * - The fifth change inside the window is refused with the date the next one
 *   becomes available.
 */
export async function updateMemberName(
  memberId: string,
  rawName: unknown,
  now: Date = new Date()
): Promise<UpdateNameResult> {
  const parsed = parseFullName(rawName);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, firstName: true, lastName: true, profileCompletedAt: true },
  });

  if (!member) {
    return { ok: false, status: 404, error: 'That member no longer exists.' };
  }

  const { firstName, lastName, fullName } = parsed.name;
  const currentFullName = `${member.firstName} ${member.lastName}`.trim();
  const countedAsChange = currentFullName !== fullName;
  const cutoff = new Date(now.getTime() - NAME_CHANGE_WINDOW_MS);

  const result = await prisma.$transaction(async (tx) => {
    const recent = await tx.nameChange.findMany({
      where: { memberId, changedAt: { gt: cutoff } },
      orderBy: { changedAt: 'asc' },
      select: { changedAt: true },
    });

    const summary = summarizeNameChanges(recent, now);

    if (countedAsChange && summary.remaining === 0) {
      return {
        ok: false as const,
        status: 429 as const,
        error: `You have used all ${NAME_CHANGE_LIMIT} name changes allowed in this 2-month period. You can change your name again from ${formatLimitDate(
          summary.windowEndsAt as Date
        )}.`,
        nameChangesUsed: summary.used,
        nameChangesRemaining: 0,
        nameChangeWindowEndsAt: summary.windowEndsAt?.toISOString() ?? null,
      };
    }

    if (countedAsChange) {
      await tx.nameChange.create({
        data: { memberId, oldName: currentFullName.slice(0, 201), newName: fullName },
      });
    }

    await tx.member.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName,
        profileCompletedAt: member.profileCompletedAt ?? now,
      },
    });

    await tx.privateAccessLog.create({
      data: {
        sessionMemberId: memberId,
        targetMemberId: memberId,
        functionName: 'updateMemberName',
      },
    });

    // Recompute from the rows that now exist, so the reported count and the
    // "next available" date are both derived from the database, not guessed.
    const timestamps = recent.map((change) => change.changedAt.getTime());
    if (countedAsChange) timestamps.push(now.getTime());
    timestamps.sort((a, b) => a - b);

    const used = timestamps.length;
    const remaining = Math.max(0, NAME_CHANGE_LIMIT - used);
    const windowEndsAt =
      used >= NAME_CHANGE_LIMIT
        ? new Date(timestamps[used - NAME_CHANGE_LIMIT] + NAME_CHANGE_WINDOW_MS)
        : null;

    return {
      ok: true as const,
      fullName,
      firstName,
      lastName,
      profileCompleted: true as const,
      countedAsChange,
      nameChangesUsed: used,
      nameChangesRemaining: remaining,
      nameChangeWindowEndsAt: windowEndsAt?.toISOString() ?? null,
    };
  });

  return result;
}

export interface MemberAvatar {
  mimeType: string;
  data: Buffer;
  updatedAt: Date | null;
}

/** Reads the signed in member's own picture. Never takes an ID from the browser. */
export async function getMemberAvatar(memberId: string): Promise<MemberAvatar | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { avatarData: true, avatarMimeType: true, avatarUpdatedAt: true },
  });

  if (!member?.avatarData || !member.avatarMimeType) return null;

  await prisma.privateAccessLog.create({
    data: {
      sessionMemberId: memberId,
      targetMemberId: memberId,
      functionName: 'getMemberAvatar',
    },
  });

  return {
    mimeType: member.avatarMimeType,
    data: Buffer.from(member.avatarData),
    updatedAt: member.avatarUpdatedAt,
  };
}

/**
 * The declared type is never trusted: the first bytes must actually be a JPEG,
 * PNG or WebP, so a renamed script cannot be stored as an image.
 */
export function sniffImageMime(data: Buffer): AvatarMimeType | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export type SaveAvatarResult =
  | { ok: true; mimeType: AvatarMimeType; avatarUpdatedAt: string }
  | { ok: false; status: 400 | 404 | 413; error: string };

export async function saveMemberAvatar(
  memberId: string,
  input: { mimeType: unknown; data: Buffer }
): Promise<SaveAvatarResult> {
  if (input.data.length === 0) {
    return { ok: false, status: 400, error: 'That file is empty.' };
  }
  if (input.data.length > AVATAR_MAX_BYTES) {
    return { ok: false, status: 413, error: 'That picture is larger than 2 MB.' };
  }

  const sniffed = sniffImageMime(input.data);
  if (!sniffed) {
    return { ok: false, status: 400, error: 'Use a JPEG, PNG or WebP picture.' };
  }
  if (typeof input.mimeType === 'string' && input.mimeType && input.mimeType !== sniffed) {
    return { ok: false, status: 400, error: 'That file does not match the picture type it claims.' };
  }

  const now = new Date();
  const updated = await prisma.member.updateMany({
    where: { id: memberId },
    data: {
      avatarData: Uint8Array.from(input.data),
      avatarMimeType: sniffed,
      avatarUpdatedAt: now,
    },
  });

  if (updated.count !== 1) {
    return { ok: false, status: 404, error: 'That member no longer exists.' };
  }

  await prisma.privateAccessLog.create({
    data: {
      sessionMemberId: memberId,
      targetMemberId: memberId,
      functionName: 'saveMemberAvatar',
    },
  });

  return { ok: true, mimeType: sniffed, avatarUpdatedAt: now.toISOString() };
}
