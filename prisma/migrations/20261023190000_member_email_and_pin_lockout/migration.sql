-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "email" TEXT,
ADD COLUMN     "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinFailedWindowStart" TIMESTAMP(3),
ADD COLUMN     "pinLockedUntil" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Member_gymId_email_key" ON "Member"("gymId", "email");
