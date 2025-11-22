/*
  Warnings:

  - You are about to drop the column `oppositionCount` on the `CivicReport` table. All the data in the column will be lost.
  - You are about to drop the column `supportCount` on the `CivicReport` table. All the data in the column will be lost.
  - The primary key for the `CivicReportSupport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `CivicReportSupport` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TrainingModule` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `TrainingModule` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserFlashcardProgress` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `UserFlashcardProgress` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserModuleProgress` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `UserModuleProgress` table. All the data in the column will be lost.
  - You are about to drop the column `accuracy` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserVideoProgress` table. All the data in the column will be lost.
  - You are about to drop the column `watched` on the `UserVideoProgress` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `UserVideoProgress` table. All the data in the column will be lost.
  - You are about to drop the `QuizOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `score` on table `UserQuizProgress` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `progress` to the `UserVideoProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PostMediaType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('like', 'dislike');

-- DropForeignKey
ALTER TABLE "public"."QuizOption" DROP CONSTRAINT "QuizOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- AlterTable
ALTER TABLE "public"."CivicReport" DROP COLUMN "oppositionCount",
DROP COLUMN "supportCount",
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."CivicReportSupport" DROP CONSTRAINT "CivicReportSupport_pkey",
DROP COLUMN "id";

-- AlterTable
ALTER TABLE "public"."TrainingModule" DROP COLUMN "createdAt",
DROP COLUMN "role",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "public"."UserFlashcardProgress" DROP COLUMN "completedAt",
DROP COLUMN "xpEarned";

-- AlterTable
ALTER TABLE "public"."UserModuleProgress" DROP COLUMN "completedAt",
DROP COLUMN "xpEarned";

-- AlterTable
ALTER TABLE "public"."UserQuizProgress" DROP COLUMN "accuracy",
DROP COLUMN "completedAt",
DROP COLUMN "xpEarned",
ALTER COLUMN "score" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserVideoProgress" DROP COLUMN "completedAt",
DROP COLUMN "watched",
DROP COLUMN "xpEarned",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progress" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Video" ADD COLUMN     "duration" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."QuizOption";

-- DropTable
DROP TABLE "public"."QuizQuestion";

-- CreateTable
CREATE TABLE "public"."CommunityPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" "public"."PostMediaType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityReaction" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateTable
CREATE TABLE "public"."CommunityFollow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFollow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReaction_userId_postId_key" ON "public"."CommunityReaction"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFollow_followerId_followingId_key" ON "public"."CommunityFollow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityReaction" ADD CONSTRAINT "CommunityReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityFollow" ADD CONSTRAINT "CommunityFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityFollow" ADD CONSTRAINT "CommunityFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
