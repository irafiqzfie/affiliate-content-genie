/*
  Warnings:

  - Made the column `userId` on table `SavedItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `ScheduledPost` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedItem" DROP CONSTRAINT "SavedItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ScheduledPost" DROP CONSTRAINT "ScheduledPost_userId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "instagramId" TEXT,
ADD COLUMN     "pageAccessToken" TEXT,
ADD COLUMN     "pageId" TEXT,
ADD COLUMN     "pageName" TEXT,
ADD COLUMN     "threadsUserId" TEXT;

-- AlterTable
ALTER TABLE "SavedItem" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "productLink" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "affiliateLink" TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Account_userId_provider_idx" ON "Account"("userId", "provider");

-- CreateIndex
CREATE INDEX "SavedItem_userId_idx" ON "SavedItem"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPost_userId_idx" ON "ScheduledPost"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPost_userId_scheduledTime_idx" ON "ScheduledPost"("userId", "scheduledTime");

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
