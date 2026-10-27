-- Member profile details. These are the details the desk captures when a member
-- joins, and they belong on the member rather than in a separate profile table
-- because there is exactly one profile per member.
ALTER TABLE "Member"
  ADD COLUMN "dateOfBirth" DATE,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "emergencyContactName" TEXT,
  ADD COLUMN "emergencyContactPhone" TEXT,
  ADD COLUMN "joinedAt" DATE;

-- Existing members joined when their record was created.
UPDATE "Member" SET "joinedAt" = "createdAt"::date;

ALTER TABLE "Member" ALTER COLUMN "joinedAt" SET NOT NULL;
ALTER TABLE "Member" ALTER COLUMN "joinedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- The gym itself is a stored entity with contact details, not just a name.
ALTER TABLE "Gym"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Same storage rules as Member.email: lower case only, never an empty string.
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_email_lowercase_check"
  CHECK ("email" IS NULL OR "email" = lower("email"));

ALTER TABLE "Gym" ADD CONSTRAINT "Gym_email_present_check"
  CHECK ("email" IS NULL OR length(btrim("email")) > 0);

ALTER TABLE "Gym" ADD CONSTRAINT "Gym_phone_present_check"
  CHECK ("phone" IS NULL OR length(btrim("phone")) > 0);
