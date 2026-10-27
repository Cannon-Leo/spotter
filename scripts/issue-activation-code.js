#!/usr/bin/env node
/**
 * Issues a one time activation code (FR-1, FR-2, FR-41).
 *
 * This exists because the staff screen that will issue codes in production is
 * not built yet. It creates or updates the member record the desk would have
 * created, then prints an eight character code once. Only the hash is stored.
 *
 *   npm run db:issue-code -- --name "Chioma Okonkwo" --phone 08031234567
 *   npm run db:issue-code -- --member-number 123456 --remote --reason "lost phone"
 *
 * Options
 *   --name            First and last name. Required for a new member.
 *   --phone           Phone number. Required for a new member.
 *   --email           Optional contact email.
 *   --dob             Date of birth, YYYY-MM-DD.
 *   --address         Postal or home address.
 *   --emergency-name  Emergency contact full name.
 *   --emergency-phone Emergency contact phone number.
 *   --joined          Join date, YYYY-MM-DD. Defaults to today.
 *   --member-number   Six digit number. Generated when omitted for a new member.
 *   --tier            BASIC (default) or PREMIUM.
 *   --days            Membership length from today, default 30.
 *   --remote          Mark the code as issued remotely (FR-5b).
 *   --reason          Reason for a remote issue (FR-5b).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// FR-1: uppercase letters and digits. I, L, O, U, 0 and 1 are left out so a
// code read from a screen or a phone cannot be mistyped for another character.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_TTL_MS = 72 * 60 * 60 * 1000;
const GYM_ID = 'spotter-gym-main';

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

/**
 * Must match hashActivationCode() in src/server/membership/member.ts exactly.
 * If you change one, change both.
 */
function hashActivationCode(code) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return crypto.createHmac('sha256', secret.trim()).update(code).digest('hex');
}

function generateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Member',
    lastName: parts.slice(1).join(' '),
  };
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function parseDateArg(value, label) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be a date in YYYY-MM-DD form.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a real calendar date.`);
  }
  return parsed;
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function uniqueMemberNumber(gymId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = String(crypto.randomInt(100000, 1000000));
    const existing = await prisma.member.findUnique({
      where: { gymId_memberNumber: { gymId, memberNumber: candidate } },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error('Could not allocate a free member number. Pass --member-number.');
}

async function issuingStaff() {
  const existing = await prisma.staff.findFirst({
    where: { gymId: GYM_ID, role: 'OWNER', active: true },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  // The staff app (and staff authentication) is not built yet. This row only
  // satisfies ActivationCode.issuedByStaffId and cannot be used to sign in to
  // anything, because no staff login exists and the hash is not a valid one.
  return prisma.staff.create({
    data: {
      gymId: GYM_ID,
      name: 'Spotter Owner',
      role: 'OWNER',
      whatsappNumber: '',
      passwordHash: '!staff-login-not-implemented!',
    },
  });
}

async function main() {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  const tier = String(args.tier || 'BASIC').toUpperCase();
  const days = Number(args.days || 30);

  if (!['BASIC', 'PREMIUM'].includes(tier)) {
    throw new Error('--tier must be BASIC or PREMIUM.');
  }
  if (!Number.isFinite(days) || days < 1 || days > 3650) {
    throw new Error('--days must be a whole number between 1 and 3650.');
  }

  const gym = await prisma.gym.upsert({
    where: { id: GYM_ID },
    update: {},
    create: {
      id: GYM_ID,
      name: 'Spotter Gym',
      timezone: 'Africa/Lagos',
      graceDays: 3,
      opensMinute: 360,
      closesMinute: 1320,
    },
  });

  const memberNumber =
    typeof args['member-number'] === 'string'
      ? args['member-number'].trim()
      : await uniqueMemberNumber(gym.id);

  if (!/^\d{6}$/.test(memberNumber)) {
    throw new Error('--member-number must be exactly six digits.');
  }

  const existingMember = await prisma.member.findUnique({
    where: { gymId_memberNumber: { gymId: gym.id, memberNumber } },
  });

  if (!existingMember) {
    if (typeof args.name !== 'string' || !args.name.trim()) {
      throw new Error('--name is required when creating a new member.');
    }
    if (typeof args.phone !== 'string' || !args.phone.trim()) {
      throw new Error('--phone is required when creating a new member.');
    }
  }

  const name =
    typeof args.name === 'string' && args.name.trim()
      ? splitName(args.name)
      : { firstName: existingMember.firstName, lastName: existingMember.lastName };
  const email =
    typeof args.email === 'string' && args.email.trim()
      ? normalizeEmail(args.email)
      : existingMember
        ? existingMember.email
        : null;

  const dateOfBirth = parseDateArg(args.dob, '--dob');
  const joinedAt = parseDateArg(args.joined, '--joined');
  const address = optionalText(args.address);
  const emergencyContactName = optionalText(args['emergency-name']);
  const emergencyContactPhone = optionalText(args['emergency-phone']);

  // Only the details supplied on this run are written, so re-issuing a code
  // never erases a member's stored profile.
  const profile = {
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(address ? { address } : {}),
    ...(emergencyContactName ? { emergencyContactName } : {}),
    ...(emergencyContactPhone ? { emergencyContactPhone } : {}),
  };

  const expiryDate = new Date(startOfTodayUtc().getTime() + days * 24 * 60 * 60 * 1000);

  const member = existingMember
    ? await prisma.member.update({
        where: { id: existingMember.id },
        data: {
          firstName: name.firstName,
          lastName: name.lastName,
          ...(typeof args.phone === 'string' && args.phone.trim()
            ? { phone: args.phone.trim() }
            : {}),
          ...(email ? { email } : {}),
          ...(joinedAt ? { joinedAt } : {}),
          ...profile,
          tier,
          expiryDate,
          cancelledAt: null,
        },
      })
    : await prisma.member.create({
        data: {
          gymId: gym.id,
          memberNumber,
          firstName: name.firstName,
          lastName: name.lastName,
          phone: args.phone.trim(),
          email,
          joinedAt: joinedAt || startOfTodayUtc(),
          ...profile,
          tier,
          expiryDate,
        },
      });

  const staff = await issuingStaff();

  const code = generateCode();
  const codeHash = hashActivationCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.activationCode.create({
    data: {
      memberId: member.id,
      codeHash,
      issuedByStaffId: staff.id,
      remote: args.remote === true,
      reason: typeof args.reason === 'string' ? args.reason : null,
      expiresAt,
    },
  });

  const lines = [
    '',
    'Activation code issued. It is shown once and never stored in plain text.',
    '',
    `  Member        ${member.firstName} ${member.lastName}`.trimEnd(),
    `  Member number ${member.memberNumber}`,
    `  Email         ${member.email || '-'}`,
    `  Joined        ${member.joinedAt.toISOString().slice(0, 10)}`,
    `  Tier          ${member.tier}`,
    `  Expires       ${expiryDate.toISOString().slice(0, 10)}`,
    `  Code valid    until ${expiresAt.toISOString()}`,
    '',
    `  CODE          ${code}`,
    '',
    'Give this code to the member. It is shown once and cannot be recovered.',
    'She enters it at /auth?view=create-account within the 72 hour window.',
    '',
  ];
  console.log(lines.join('\n'));
}

main()
  .catch((err) => {
    console.error('\nFailed to issue an activation code:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
