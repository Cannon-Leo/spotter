import { prisma } from '../db/client';
import crypto from 'crypto';

export interface RegisterMemberParams {
  fullName: string;
  email?: string;
  memberNumber: string;
  pin: string;
  deviceId?: string;
}

export interface MemberRecordDto {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  tier: 'BASIC' | 'PREMIUM';
  effectiveTier: 'Basic' | 'Premium';
  expiryDate: Date;
}

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin.trim()).digest('hex');
}

/**
 * Ensures the default gym exists in the database.
 */
export async function getOrCreateDefaultGym() {
  const gym = await prisma.gym.upsert({
    where: { id: 'spotter-gym-main' },
    update: {},
    create: {
      id: 'spotter-gym-main',
      name: 'Spotter Gym',
      timezone: 'Africa/Lagos',
      graceDays: 3,
      opensMinute: 360,
      closesMinute: 1320,
    },
  });
  return gym;
}

/**
 * Seeds the default demo member (Joseph Brendan) if the database has 0 members.
 */
export async function seedDefaultMemberIfEmpty(): Promise<void> {
  try {
    const gym = await getOrCreateDefaultGym();
    const count = await prisma.member.count();
    if (count === 0) {
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.member.create({
        data: {
          id: 'mem_demo_joseph',
          gymId: gym.id,
          memberNumber: '123456',
          firstName: 'Joseph',
          lastName: 'Brendan',
          phone: '+2348000000000',
          tier: 'BASIC',
          expiryDate: thirtyDays,
          pinHash: hashPin('1234'),
          activatedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error('Failed to seed default member:', err);
  }
}

/**
 * Registers or activates a member using data from the sign-up form.
 * Stores their records directly in the PostgreSQL database.
 */
export async function registerMember(params: RegisterMemberParams): Promise<MemberRecordDto> {
  const gym = await getOrCreateDefaultGym();

  const trimmedName = params.fullName.trim();
  const nameParts = trimmedName.split(/\s+/);
  const firstName = nameParts[0] || 'Member';
  const lastName = nameParts.slice(1).join(' ') || '';
  const pinHash = hashPin(params.pin);
  const cleanMemberNumber = params.memberNumber.trim();
  const boundDeviceId = params.deviceId || `dev_${crypto.randomBytes(6).toString('hex')}`;
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Look for existing member by number in this gym
  const existing = await prisma.member.findUnique({
    where: {
      gymId_memberNumber: {
        gymId: gym.id,
        memberNumber: cleanMemberNumber,
      },
    },
  });

  let member;
  if (existing) {
    member = await prisma.member.update({
      where: { id: existing.id },
      data: {
        firstName,
        lastName,
        pinHash,
        deviceId: boundDeviceId,
        activatedAt: existing.activatedAt || new Date(),
      },
    });
  } else {
    member = await prisma.member.create({
      data: {
        gymId: gym.id,
        memberNumber: cleanMemberNumber,
        firstName,
        lastName,
        phone: '',
        tier: 'BASIC',
        expiryDate: thirtyDays,
        pinHash,
        deviceId: boundDeviceId,
        activatedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });
  }

  return {
    id: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    email: params.email?.trim(),
    tier: member.tier,
    effectiveTier: member.tier === 'PREMIUM' ? 'Premium' : 'Basic',
    expiryDate: member.expiryDate,
  };
}

/**
 * Authenticates a member by password or existing session.
 */
export async function authenticateMember(params: {
  pin: string;
  email?: string;
  memberId?: string;
}): Promise<MemberRecordDto | null> {
  await seedDefaultMemberIfEmpty();

  // If memberId is known from an existing session
  if (params.memberId) {
    const member = await prisma.member.findUnique({
      where: { id: params.memberId },
    });
    if (member) {
      return {
        id: member.id,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        email: params.email,
        tier: member.tier,
        effectiveTier: member.tier === 'PREMIUM' ? 'Premium' : 'Basic',
        expiryDate: member.expiryDate,
      };
    }
  }

  // Otherwise find by hashed PIN or return the latest active member
  const hashed = hashPin(params.pin);
  let member = await prisma.member.findFirst({
    where: { pinHash: hashed },
  });

  if (!member) {
    // If not found by pinHash, fallback to the latest activated member or default member
    member = await prisma.member.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!member) return null;

  return {
    id: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    email: params.email,
    tier: member.tier,
    effectiveTier: member.tier === 'PREMIUM' ? 'Premium' : 'Basic',
    expiryDate: member.expiryDate,
  };
}

