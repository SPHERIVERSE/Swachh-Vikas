/*
  Warnings:

  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `xpAward` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `UserQuizProgress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reportId,userId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `question` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Notification_reportId_key";

-- AlterTable
ALTER TABLE "public"."CivicReport" ADD COLUMN     "resolvedNotes" TEXT;

-- AlterTable
ALTER TABLE "public"."Quiz" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "public"."QuizQuestion" DROP COLUMN "text",
DROP COLUMN "xpAward",
ADD COLUMN     "question" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserQuizProgress" DROP COLUMN "completed",
ADD COLUMN     "accuracy" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_reportId_userId_key" ON "public"."Notification"("reportId", "userId");
