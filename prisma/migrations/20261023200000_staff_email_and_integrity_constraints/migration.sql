-- Staff are users too: the staff sign in flow (separate cookie and session
-- handling, PRD 6.8 and 8.3) needs an email identifier. Nullable because the
-- staff sign in screen does not exist yet and existing rows have no email.
ALTER TABLE "Staff" ADD COLUMN     "email" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ActivationCode_expiresAt_idx" ON "ActivationCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_gymId_email_key" ON "Staff"("gymId", "email");

-- ---------------------------------------------------------------------------
-- Integrity rules the model implies but the Prisma schema cannot express.
-- Prisma does not manage CHECK constraints, so these survive future migrations.
-- ---------------------------------------------------------------------------

-- Member emails are stored lower case so a mixed case duplicate cannot create
-- two accounts for one person (the unique index is case sensitive).
ALTER TABLE "Member" ADD CONSTRAINT "Member_email_lowercase_check"
  CHECK ("email" IS NULL OR "email" = lower("email"));

-- phone is required and is the number the desk uses for remote activation
-- codes (FR-5b), so an empty string is not a valid value.
ALTER TABLE "Member" ADD CONSTRAINT "Member_phone_present_check"
  CHECK (length(btrim("phone")) > 0);

-- FR-4: a session is bound to a device, so the binding may not be blank.
ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_device_present_check"
  CHECK (length(btrim("deviceId")) > 0);

-- Opening hours are minutes since midnight.
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_opening_hours_check"
  CHECK ("opensMinute" >= 0 AND "closesMinute" <= 1440 AND "opensMinute" < "closesMinute");

-- A plan prices something for a length of time.
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_amounts_check"
  CHECK ("priceKobo" > 0 AND "durationDays" > 0);

-- A shift is a range on a day of the week.
ALTER TABLE "DeskShift" ADD CONSTRAINT "DeskShift_range_check"
  CHECK (
    "dayOfWeek" BETWEEN 0 AND 6
    AND "startMinute" >= 0
    AND "endMinute" <= 1440
    AND "startMinute" < "endMinute"
  );

-- A check in code is exactly four digits (FR-18).
ALTER TABLE "CheckInCode" ADD CONSTRAINT "CheckInCode_four_digits_check"
  CHECK ("code" ~ '^[0-9]{4}$');

-- The ledger sign convention only works if zero is never posted.
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_amount_nonzero_check"
  CHECK ("amountKobo" <> 0);

-- A payment moves money and the gateway fee can be zero, never negative.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amounts_check"
  CHECK ("amountKobo" > 0 AND "feeKobo" >= 0);

-- An activation code must expire after it was created (FR-2).
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_expiry_after_creation_check"
  CHECK ("expiresAt" > "createdAt");
