-- Member deletion.
--
-- A member row is the root of her own private records. Every table below holds
-- data that has no meaning without that member, so deleting her must delete
-- them in the same statement instead of refusing the delete.
--
-- Before this migration all eleven relations used the default RESTRICT, which
-- meant any member with a session (that is, every member who ever signed in)
-- could not be deleted at all: PostgreSQL raised a foreign key error and the
-- row stayed in place.
--
-- Deliberately unchanged: Staff, Gym, MembershipPlan, Card and CheckInCode are
-- still RESTRICT. Those rows are shared or auditable and are deactivated, not
-- deleted. Deleting a member never removes the staff member who served her.

-- DropForeignKey
ALTER TABLE "ActivationCode" DROP CONSTRAINT "ActivationCode_memberId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAudit" DROP CONSTRAINT "AnswerAudit_questionLogId_fkey";

-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Handoff" DROP CONSTRAINT "Handoff_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Handoff" DROP CONSTRAINT "Handoff_questionLogId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSession" DROP CONSTRAINT "MemberSession_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MembershipChange" DROP CONSTRAINT "MembershipChange_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_memberId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAttempt" DROP CONSTRAINT "PaymentAttempt_memberId_fkey";

-- DropForeignKey
ALTER TABLE "PrivateAccessLog" DROP CONSTRAINT "PrivateAccessLog_targetMemberId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionLog" DROP CONSTRAINT "QuestionLog_memberId_fkey";

-- DropForeignKey
ALTER TABLE "WrongAnswerReport" DROP CONSTRAINT "WrongAnswerReport_memberId_fkey";

-- DropForeignKey
ALTER TABLE "WrongAnswerReport" DROP CONSTRAINT "WrongAnswerReport_questionLogId_fkey";

-- AddForeignKey
ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateAccessLog" ADD CONSTRAINT "PrivateAccessLog_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongAnswerReport" ADD CONSTRAINT "WrongAnswerReport_questionLogId_fkey" FOREIGN KEY ("questionLogId") REFERENCES "QuestionLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongAnswerReport" ADD CONSTRAINT "WrongAnswerReport_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAudit" ADD CONSTRAINT "AnswerAudit_questionLogId_fkey" FOREIGN KEY ("questionLogId") REFERENCES "QuestionLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_questionLogId_fkey" FOREIGN KEY ("questionLogId") REFERENCES "QuestionLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
