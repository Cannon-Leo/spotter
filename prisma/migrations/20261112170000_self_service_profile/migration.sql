-- Self service member profile.
--
-- The desk creates a member row before she has ever chosen a name, so the name
-- on that row is only a placeholder. profileCompletedAt records the moment she
-- sets her own name in the app; until then the dashboard never presents the
-- placeholder as fact.
--
-- The picture is stored on the row so no external bucket or writable folder is
-- needed. The browser downscales it to 512 px and the API rejects anything
-- larger than 2 MB before it reaches this table.
--
-- NameChange is the audit trail behind the limit of four full name changes in a
-- rolling two month window. It cascades with the member: her history has no
-- meaning without her.

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "avatarData" BYTEA,
ADD COLUMN     "avatarMimeType" VARCHAR(50),
ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NameChange" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "oldName" VARCHAR(201) NOT NULL,
    "newName" VARCHAR(201) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NameChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NameChange_memberId_changedAt_idx" ON "NameChange"("memberId", "changedAt");

-- AddForeignKey
ALTER TABLE "NameChange" ADD CONSTRAINT "NameChange_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
