-- CreateEnum
CREATE TYPE "public"."WasteType" AS ENUM ('PLASTIC', 'PAPER', 'METAL', 'GLASS', 'ORGANIC', 'ELECTRONIC', 'TEXTILE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DriveStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."QuizStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'BUSINESS';

-- CreateTable
CREATE TABLE "public"."WasteListing" (
    "id" TEXT NOT NULL,
    "wasteType" "public"."WasteType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,

    CONSTRAINT "WasteListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CSRFund" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "CSRFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CSRFundAllocation" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundId" TEXT NOT NULL,

    CONSTRAINT "CSRFundAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityDrive" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."DriveStatus" NOT NULL DEFAULT 'UPCOMING',
    "targetParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "rewardAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "CommunityDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityDriveParticipation" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CommunityDriveParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwarenessQuiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "AwarenessQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwarenessQuizParticipation" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "answers" JSONB NOT NULL,
    "rewardEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AwarenessQuizParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteListing_sellerId_idx" ON "public"."WasteListing"("sellerId");

-- CreateIndex
CREATE INDEX "WasteListing_buyerId_idx" ON "public"."WasteListing"("buyerId");

-- CreateIndex
CREATE INDEX "WasteListing_wasteType_idx" ON "public"."WasteListing"("wasteType");

-- CreateIndex
CREATE INDEX "WasteListing_status_idx" ON "public"."WasteListing"("status");

-- CreateIndex
CREATE INDEX "WasteListing_createdAt_idx" ON "public"."WasteListing"("createdAt");

-- CreateIndex
CREATE INDEX "CSRFund_businessId_idx" ON "public"."CSRFund"("businessId");

-- CreateIndex
CREATE INDEX "CSRFundAllocation_fundId_idx" ON "public"."CSRFundAllocation"("fundId");

-- CreateIndex
CREATE INDEX "CommunityDrive_organizerId_idx" ON "public"."CommunityDrive"("organizerId");

-- CreateIndex
CREATE INDEX "CommunityDrive_status_idx" ON "public"."CommunityDrive"("status");

-- CreateIndex
CREATE INDEX "CommunityDrive_startDate_idx" ON "public"."CommunityDrive"("startDate");

-- CreateIndex
CREATE INDEX "CommunityDriveParticipation_driveId_idx" ON "public"."CommunityDriveParticipation"("driveId");

-- CreateIndex
CREATE INDEX "CommunityDriveParticipation_userId_idx" ON "public"."CommunityDriveParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityDriveParticipation_driveId_userId_key" ON "public"."CommunityDriveParticipation"("driveId", "userId");

-- CreateIndex
CREATE INDEX "AwarenessQuiz_organizerId_idx" ON "public"."AwarenessQuiz"("organizerId");

-- CreateIndex
CREATE INDEX "AwarenessQuiz_status_idx" ON "public"."AwarenessQuiz"("status");

-- CreateIndex
CREATE INDEX "AwarenessQuiz_startDate_idx" ON "public"."AwarenessQuiz"("startDate");

-- CreateIndex
CREATE INDEX "AwarenessQuizParticipation_quizId_idx" ON "public"."AwarenessQuizParticipation"("quizId");

-- CreateIndex
CREATE INDEX "AwarenessQuizParticipation_userId_idx" ON "public"."AwarenessQuizParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AwarenessQuizParticipation_quizId_userId_key" ON "public"."AwarenessQuizParticipation"("quizId", "userId");

-- CreateIndex
CREATE INDEX "Reward_businessId_idx" ON "public"."Reward"("businessId");

-- CreateIndex
CREATE INDEX "Reward_recipientId_idx" ON "public"."Reward"("recipientId");

-- AddForeignKey
ALTER TABLE "public"."WasteListing" ADD CONSTRAINT "WasteListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteListing" ADD CONSTRAINT "WasteListing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CSRFund" ADD CONSTRAINT "CSRFund_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CSRFundAllocation" ADD CONSTRAINT "CSRFundAllocation_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."CSRFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityDrive" ADD CONSTRAINT "CommunityDrive_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityDriveParticipation" ADD CONSTRAINT "CommunityDriveParticipation_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "public"."CommunityDrive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityDriveParticipation" ADD CONSTRAINT "CommunityDriveParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwarenessQuiz" ADD CONSTRAINT "AwarenessQuiz_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwarenessQuizParticipation" ADD CONSTRAINT "AwarenessQuizParticipation_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."AwarenessQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwarenessQuizParticipation" ADD CONSTRAINT "AwarenessQuizParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reward" ADD CONSTRAINT "Reward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reward" ADD CONSTRAINT "Reward_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
