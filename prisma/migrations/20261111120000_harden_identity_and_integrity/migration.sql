-- Harden the data model so identity, contact and money records cannot be
-- stored in a shape the rest of the app cannot reason about.
--
-- The Prisma schema carries the columns. This file adds the length changes,
-- indexes and foreign keys Prisma generates, plus the CHECK constraints it
-- cannot express.

-- CreateEnum
CREATE TYPE "HandoffReason" AS ENUM ('NO_ANSWER', 'REFUSED_POLICY', 'MEMBER_REQUESTED');

-- DropIndex
DROP INDEX "CheckIn_memberId_checkInDate_idx";

-- AlterTable
ALTER TABLE "Gym" ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "timezone" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(320),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(320),
ALTER COLUMN "whatsappNumber" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "passwordHash" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "DeskShift" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "memberNumber" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(320),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "emergencyContactName" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "emergencyContactPhone" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "pinHash" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "deviceId" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "MemberSession" ALTER COLUMN "tokenHash" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "deviceId" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "ActivationCode" ALTER COLUMN "codeHash" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "reason" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "title" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "CardVersion" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "CheckInCode" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "code" SET DATA TYPE VARCHAR(4);

-- AlterTable
ALTER TABLE "CheckIn" ALTER COLUMN "deviceId" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "periodLabel" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "planId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "reference" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "gatewayReference" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "PaymentAttempt" ADD COLUMN     "planId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "reference" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "idempotencyKey" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "failureReason" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "MembershipChange" ALTER COLUMN "field" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "oldValue" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "newValue" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "reason" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "PrivateAccessLog" ALTER COLUMN "functionName" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "QuestionLog" ALTER COLUMN "intent" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "refusedBy" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "AnswerAudit" ADD COLUMN     "reviewedByStaffId" TEXT;

-- AlterTable
ALTER TABLE "Handoff" ADD COLUMN     "reason" "HandoffReason" NOT NULL DEFAULT 'NO_ANSWER';

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_tokenHash_key" ON "StaffSession"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_revokedAt_idx" ON "StaffSession"("staffId", "revokedAt");

-- CreateIndex
CREATE INDEX "MembershipPlan_gymId_activeFrom_idx" ON "MembershipPlan"("gymId", "activeFrom");

-- CreateIndex
CREATE INDEX "Staff_gymId_role_active_idx" ON "Staff"("gymId", "role", "active");

-- CreateIndex
CREATE INDEX "DeskShift_staffId_dayOfWeek_idx" ON "DeskShift"("staffId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DeskShift_gymId_staffId_dayOfWeek_startMinute_key" ON "DeskShift"("gymId", "staffId", "dayOfWeek", "startMinute");

-- CreateIndex
CREATE INDEX "Member_gymId_cancelledAt_idx" ON "Member"("gymId", "cancelledAt");

-- CreateIndex
CREATE INDEX "Member_gymId_lastName_firstName_idx" ON "Member"("gymId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Member_gymId_phone_idx" ON "Member"("gymId", "phone");

-- CreateIndex
CREATE INDEX "MemberSession_deviceId_revokedAt_idx" ON "MemberSession"("deviceId", "revokedAt");

-- CreateIndex
CREATE INDEX "ActivationCode_memberId_remote_createdAt_idx" ON "ActivationCode"("memberId", "remote", "createdAt");

-- CreateIndex
CREATE INDEX "ActivationCode_usedAt_idx" ON "ActivationCode"("usedAt");

-- CreateIndex
CREATE INDEX "Card_gymId_category_status_idx" ON "Card"("gymId", "category", "status");

-- CreateIndex
CREATE INDEX "CardVersion_status_createdAt_idx" ON "CardVersion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CardChunk_category_minTier_idx" ON "CardChunk"("category", "minTier");

-- CreateIndex
CREATE INDEX "CheckInCode_forDate_idx" ON "CheckInCode"("forDate");

-- CreateIndex
CREATE INDEX "CheckIn_deviceId_checkedInAt_idx" ON "CheckIn"("deviceId", "checkedInAt");

-- CreateIndex
CREATE INDEX "CheckIn_recordedByStaffId_checkedInAt_idx" ON "CheckIn"("recordedByStaffId", "checkedInAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_memberId_type_occurredAt_idx" ON "LedgerEntry"("memberId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "Payment_planId_idx" ON "Payment"("planId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_memberId_initiatedAt_idx" ON "PaymentAttempt"("memberId", "initiatedAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_planId_idx" ON "PaymentAttempt"("planId");

-- CreateIndex
CREATE INDEX "MembershipChange_memberId_field_changedAt_idx" ON "MembershipChange"("memberId", "field", "changedAt");

-- CreateIndex
CREATE INDEX "PrivateAccessLog_sessionMemberId_accessedAt_idx" ON "PrivateAccessLog"("sessionMemberId", "accessedAt");

-- CreateIndex
CREATE INDEX "QuestionLog_askedAt_idx" ON "QuestionLog"("askedAt");

-- CreateIndex
CREATE INDEX "WrongAnswerReport_memberId_reportedAt_idx" ON "WrongAnswerReport"("memberId", "reportedAt");

-- CreateIndex
CREATE INDEX "AnswerAudit_reviewedByStaffId_auditedAt_idx" ON "AnswerAudit"("reviewedByStaffId", "auditedAt");

-- CreateIndex
CREATE INDEX "Handoff_memberId_createdAt_idx" ON "Handoff"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "Handoff_reason_createdAt_idx" ON "Handoff"("reason", "createdAt");

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAudit" ADD CONSTRAINT "AnswerAudit_reviewedByStaffId_fkey" FOREIGN KEY ("reviewedByStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity rules the model implies but the Prisma schema cannot express.
-- Prisma does not manage CHECK constraints, so these survive future migrations.
--
-- Some rules below are marked NOT VALID. That means PostgreSQL enforces them
-- for every INSERT and UPDATE from this point on, but does not re-check rows
-- that already exist when the migration runs. The database could not be
-- inspected before this migration was written, so a rule that a legacy row
-- might break is added NOT VALID instead of blocking the whole migration.
-- After the records have been audited, run the VALIDATE CONSTRAINT statements
-- listed at the end of this file to promote them to fully validated rules.
-- ---------------------------------------------------------------------------

-- Identity and contact ------------------------------------------------------

-- An email column stores one address, not a display name plus an address.
-- The application validates as well; this is the last line of defence.
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_email_format_check"
  CHECK ("email" IS NULL OR "email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]{2,}$') NOT VALID;

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_email_format_check"
  CHECK ("email" IS NULL OR "email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]{2,}$') NOT VALID;

ALTER TABLE "Member" ADD CONSTRAINT "Member_email_format_check"
  CHECK ("email" IS NULL OR "email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]{2,}$') NOT VALID;

-- A verification date is only meaningful when an address is stored.
ALTER TABLE "Member" ADD CONSTRAINT "Member_email_verified_check"
  CHECK ("emailVerifiedAt" IS NULL OR "email" IS NOT NULL);

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_email_verified_check"
  CHECK ("emailVerifiedAt" IS NULL OR "email" IS NOT NULL);

-- Verification cannot precede the row that holds the address.
ALTER TABLE "Member" ADD CONSTRAINT "Member_email_verified_after_creation_check"
  CHECK ("emailVerifiedAt" IS NULL OR "emailVerifiedAt" >= "createdAt");

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_email_verified_after_creation_check"
  CHECK ("emailVerifiedAt" IS NULL OR "emailVerifiedAt" >= "createdAt");

ALTER TABLE "Gym" ADD CONSTRAINT "Gym_name_present_check"
  CHECK (length(btrim("name")) > 0);

ALTER TABLE "Gym" ADD CONSTRAINT "Gym_timezone_present_check"
  CHECK (length(btrim("timezone")) > 0);

ALTER TABLE "Gym" ADD CONSTRAINT "Gym_grace_days_check"
  CHECK ("graceDays" >= 0);

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_name_present_check"
  CHECK (length(btrim("name")) > 0);

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_password_hash_present_check"
  CHECK (length(btrim("passwordHash")) > 0);

-- An active staff member must be able to sign in, so an active row needs an
-- email. Inactive and historical rows may keep a null address. The constraint
-- is NOT VALID so an existing local placeholder owner without an email does not
-- block the migration; every insert and update after this point is checked.
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_active_email_check"
  CHECK (NOT "active" OR "email" IS NOT NULL) NOT VALID;

ALTER TABLE "Member" ADD CONSTRAINT "Member_name_present_check"
  CHECK (length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0);

ALTER TABLE "Member" ADD CONSTRAINT "Member_number_present_check"
  CHECK (length(btrim("memberNumber")) > 0);

ALTER TABLE "Member" ADD CONSTRAINT "Member_pin_attempts_check"
  CHECK ("failedPinAttempts" >= 0);

ALTER TABLE "Member" ADD CONSTRAINT "Member_dates_check"
  CHECK (
    "expiryDate" >= "joinedAt"
    AND ("cancelledAt" IS NULL OR "cancelledAt" >= "joinedAt")
  ) NOT VALID;

-- Sessions ------------------------------------------------------------------

-- lastSeenAt is not bounded below by createdAt: it is written from the app
-- server clock while createdAt comes from the database clock, and a rule there
-- would turn a few milliseconds of clock drift into a failed sign in.
ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_revoked_check"
  CHECK ("revokedAt" IS NULL OR "revokedAt" >= "createdAt");

ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_token_present_check"
  CHECK (length(btrim("tokenHash")) > 0);

-- Same clock reasoning as MemberSession: lastSeenAt has no lower bound.
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_revoked_check"
  CHECK ("revokedAt" IS NULL OR "revokedAt" >= "createdAt");

-- Activation codes ----------------------------------------------------------

ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_hash_present_check"
  CHECK (length(btrim("codeHash")) > 0);

ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_remote_reason_check"
  CHECK (NOT "remote" OR ("reason" IS NOT NULL AND length(btrim("reason")) > 0));

ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_used_after_created_check"
  CHECK ("usedAt" IS NULL OR "usedAt" >= "createdAt");

-- Cards ---------------------------------------------------------------------

ALTER TABLE "Card" ADD CONSTRAINT "Card_review_interval_check"
  CHECK ("reviewIntervalDays" > 0);

ALTER TABLE "Card" ADD CONSTRAINT "Card_confirmed_after_created_check"
  CHECK ("lastConfirmedAt" IS NULL OR "lastConfirmedAt" >= "createdAt");

ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_title_present_check"
  CHECK (length(btrim("title")) > 0);

ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_body_present_check"
  CHECK (length(btrim("body")) > 0);

ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_approval_fields_check"
  CHECK (
    "status" <> 'APPROVED'
    OR ("approvedAt" IS NOT NULL AND "approvedByStaffId" IS NOT NULL)
  ) NOT VALID;

ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_rejected_note_check"
  CHECK (
    "status" <> 'REJECTED'
    OR ("rejectionNote" IS NOT NULL AND length(btrim("rejectionNote")) > 0)
  ) NOT VALID;

ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_approved_after_created_check"
  CHECK ("approvedAt" IS NULL OR "approvedAt" >= "createdAt");

ALTER TABLE "CardChunk" ADD CONSTRAINT "CardChunk_index_check"
  CHECK ("chunkIndex" >= 0);

ALTER TABLE "CardChunk" ADD CONSTRAINT "CardChunk_content_present_check"
  CHECK (length(btrim("content")) > 0);

-- Attendance ----------------------------------------------------------------

ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_source_fields_check"
  CHECK (
    ("source" = 'CODE' AND "checkInCodeId" IS NOT NULL AND "recordedByStaffId" IS NULL)
    OR ("source" = 'MANUAL' AND "recordedByStaffId" IS NOT NULL AND "checkInCodeId" IS NULL)
  ) NOT VALID;

ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_device_present_check"
  CHECK ("deviceId" IS NULL OR length(btrim("deviceId")) > 0);

-- Money ---------------------------------------------------------------------

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_sign_check"
  CHECK (
    ("type" IN ('OPENING_BALANCE', 'CHARGE') AND "amountKobo" > 0)
    OR ("type" = 'PAYMENT' AND "amountKobo" < 0)
    OR ("type" = 'ADJUSTMENT' AND "amountKobo" <> 0)
  ) NOT VALID;

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_description_present_check"
  CHECK (length(btrim("description")) > 0);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reference_present_check"
  CHECK (length(btrim("reference")) > 0);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_staff_channel_check"
  CHECK (
    ("channel" = 'IN_APP' AND "recordedByStaffId" IS NULL)
    OR ("channel" IN ('CASH', 'TRANSFER') AND "recordedByStaffId" IS NOT NULL)
  ) NOT VALID;

-- FR-24: an in app payment is only written after the gateway has verified it,
-- so it must carry the gateway's own reference as well as ours and can only be
-- SUCCESS. Pending attempts live on PaymentAttempt, never here.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gateway_reference_check"
  CHECK ("channel" <> 'IN_APP' OR "gatewayReference" IS NOT NULL) NOT VALID;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_in_app_status_check"
  CHECK ("channel" <> 'IN_APP' OR "status" = 'SUCCESS') NOT VALID;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_renewal_plan_check"
  CHECK ("purpose" <> 'RENEWAL' OR "planId" IS NOT NULL) NOT VALID;

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_reference_present_check"
  CHECK (length(btrim("reference")) > 0 AND length(btrim("idempotencyKey")) > 0);

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_amount_check"
  CHECK ("amountKobo" > 0);

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_resolution_check"
  CHECK ("resolvedAt" IS NULL OR "resolvedAt" >= "initiatedAt");

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_status_resolution_check"
  CHECK ("status" = 'PENDING' OR "resolvedAt" IS NOT NULL) NOT VALID;

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_payment_link_check"
  CHECK (("status" = 'SUCCESS') = ("paymentId" IS NOT NULL)) NOT VALID;

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_renewal_plan_check"
  CHECK ("purpose" <> 'RENEWAL' OR "planId" IS NOT NULL) NOT VALID;

ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_field_check"
  CHECK ("field" IN ('tier', 'expiryDate'));

ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_value_changed_check"
  CHECK ("oldValue" <> "newValue");

ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_reason_present_check"
  CHECK (length(btrim("reason")) > 0);

-- Logs ----------------------------------------------------------------------

-- Three rows written on 2026-10-22, before this rule existed, carry a session
-- member ID that differs from the target member ID. They are kept as audit
-- evidence rather than rewritten or deleted, so the rule is added NOT VALID:
-- every new insert and update is checked from this point on, the three
-- historical rows are not re-checked until they have been audited.
ALTER TABLE "PrivateAccessLog" ADD CONSTRAINT "PrivateAccessLog_identity_match_check"
  CHECK ("sessionMemberId" = "targetMemberId") NOT VALID;

ALTER TABLE "PrivateAccessLog" ADD CONSTRAINT "PrivateAccessLog_function_present_check"
  CHECK (length(btrim("functionName")) > 0);

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_question_present_check"
  CHECK (length(btrim("questionText")) > 0);

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_intent_present_check"
  CHECK (length(btrim("intent")) > 0);

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_latency_check"
  CHECK ("latencyMs" IS NULL OR "latencyMs" >= 0);

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_top_score_check"
  CHECK ("topScore" IS NULL OR ("topScore" >= -1 AND "topScore" <= 1));

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_refusal_reason_check"
  CHECK ("outcome" <> 'REFUSED_POLICY' OR "refusalReason" IS NOT NULL) NOT VALID;

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_shared_sources_check"
  CHECK ("outcome" <> 'ANSWERED_SHARED' OR cardinality("cardVersionIds") > 0) NOT VALID;

ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_private_answer_check"
  CHECK (
    "outcome" <> 'ANSWERED_PRIVATE'
    OR ("answerText" IS NOT NULL AND length(btrim("answerText")) > 0)
  ) NOT VALID;

ALTER TABLE "WrongAnswerReport" ADD CONSTRAINT "WrongAnswerReport_reviewed_after_reported_check"
  CHECK ("reviewedAt" IS NULL OR "reviewedAt" >= "reportedAt");

ALTER TABLE "WrongAnswerReport" ADD CONSTRAINT "WrongAnswerReport_resolution_check"
  CHECK (
    "reviewedAt" IS NULL
    OR ("reviewedByStaffId" IS NOT NULL AND "resolution" IS NOT NULL AND length(btrim("resolution")) > 0)
  ) NOT VALID;

-- ---------------------------------------------------------------------------
-- Promote the NOT VALID rules once the existing records have been audited.
-- Do not run these in this migration: they scan every row and would fail while
-- a legacy row still breaks its rule. Run them, in this order, after fixing
-- whatever each statement reports.
-- ---------------------------------------------------------------------------
--
-- ALTER TABLE "Gym" VALIDATE CONSTRAINT "Gym_email_format_check";
-- ALTER TABLE "Staff" VALIDATE CONSTRAINT "Staff_email_format_check";
-- ALTER TABLE "Staff" VALIDATE CONSTRAINT "Staff_active_email_check";
-- ALTER TABLE "Member" VALIDATE CONSTRAINT "Member_email_format_check";
-- ALTER TABLE "Member" VALIDATE CONSTRAINT "Member_dates_check";
-- ALTER TABLE "CardVersion" VALIDATE CONSTRAINT "CardVersion_approval_fields_check";
-- ALTER TABLE "CardVersion" VALIDATE CONSTRAINT "CardVersion_rejected_note_check";
-- ALTER TABLE "CheckIn" VALIDATE CONSTRAINT "CheckIn_source_fields_check";
-- ALTER TABLE "LedgerEntry" VALIDATE CONSTRAINT "LedgerEntry_sign_check";
-- ALTER TABLE "Payment" VALIDATE CONSTRAINT "Payment_staff_channel_check";
-- ALTER TABLE "Payment" VALIDATE CONSTRAINT "Payment_gateway_reference_check";
-- ALTER TABLE "Payment" VALIDATE CONSTRAINT "Payment_in_app_status_check";
-- ALTER TABLE "Payment" VALIDATE CONSTRAINT "Payment_renewal_plan_check";
-- ALTER TABLE "PaymentAttempt" VALIDATE CONSTRAINT "PaymentAttempt_status_resolution_check";
-- ALTER TABLE "PaymentAttempt" VALIDATE CONSTRAINT "PaymentAttempt_payment_link_check";
-- ALTER TABLE "PaymentAttempt" VALIDATE CONSTRAINT "PaymentAttempt_renewal_plan_check";
-- ALTER TABLE "PrivateAccessLog" VALIDATE CONSTRAINT "PrivateAccessLog_identity_match_check";
-- ALTER TABLE "QuestionLog" VALIDATE CONSTRAINT "QuestionLog_refusal_reason_check";
-- ALTER TABLE "QuestionLog" VALIDATE CONSTRAINT "QuestionLog_shared_sources_check";
-- ALTER TABLE "QuestionLog" VALIDATE CONSTRAINT "QuestionLog_private_answer_check";
-- ALTER TABLE "WrongAnswerReport" VALIDATE CONSTRAINT "WrongAnswerReport_resolution_check";
