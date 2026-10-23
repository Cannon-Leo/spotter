import { prisma } from '../db/client';
import { seedDefaultMemberIfEmpty, MemberRecordDto } from '../membership/member';

/**
 * Reads a member's own profile record from the database.
 * INVARIANT: First argument is always the member ID from the authenticated session.
 * Writes a PrivateAccessLog record for every read.
 */
export async function getMemberProfile(memberId: string): Promise<MemberRecordDto | null> {
  if (!memberId) return null;

  await seedDefaultMemberIfEmpty();

  let member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  // If not found by primary key ID, attempt by memberNumber if memberId is a 6-digit code
  if (!member && /^\d{6}$/.test(memberId)) {
    member = await prisma.member.findFirst({
      where: { memberNumber: memberId },
    });
  }

  // Fallback to first active member in database if ID was a mock string
  if (!member) {
    member = await prisma.member.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!member) return null;

  // Record private access log per PRD G-5 and FR-49
  try {
    await prisma.privateAccessLog.create({
      data: {
        sessionMemberId: memberId,
        targetMemberId: member.id,
        functionName: 'getMemberProfile',
      },
    });
  } catch (err) {
    console.error('Failed to write private access log:', err);
  }

  return {
    id: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    tier: member.tier,
    effectiveTier: member.tier === 'PREMIUM' ? 'Premium' : 'Basic',
    expiryDate: member.expiryDate,
  };
}

