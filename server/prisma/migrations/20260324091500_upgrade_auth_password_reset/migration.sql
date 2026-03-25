-- RenameColumn
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "resetPasswordTokenHash" TEXT,
ADD COLUMN     "resetPasswordExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordTokenHash_key" ON "User"("resetPasswordTokenHash");
