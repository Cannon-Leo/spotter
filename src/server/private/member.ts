import { prisma } from '../db/client';
import { MemberRecordDto, toMemberRecord } from '../membership/member';

/**
 * Reads a member's own profile record.
 *
 * INVARIANTS
 * - The first argument is always the member ID from the server session.
 * - The row is fetched by that exact ID. There is no fallback: a session that
 *   does not match a member reads nothing (FR-15, G-5).
 * - Every read writes a PrivateAccessLog row, and the logged session member ID
 *   and queried member ID are the same value by construction (FR-16b).
 * - If the log cannot be written, the read fails. An unaudited private read
 *   must not succeed.
 */
export async function getMemberProfile(memberId: string): Promise<MemberRecordDto | null> {
  if (!memberId) return null;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { gym: true },
  });

  // Nothing was read, so there is nothing to log. The foreign key on
  // PrivateAccessLog.targetMemberId also makes this the only valid choice.
  if (!member) return null;

  await prisma.privateAccessLog.create({
    data: {
      sessionMemberId: memberId,
      targetMemberId: member.id,
      functionName: 'getMemberProfile',
    },
  });

  return toMemberRecord(member);
}
