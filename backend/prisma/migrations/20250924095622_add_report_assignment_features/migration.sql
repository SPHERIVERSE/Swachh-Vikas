/*
  Warnings:

  - You are about to drop the column `accuracy` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `UserQuizProgress` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."ReportStatus" ADD VALUE 'assigned';

-- AlterTable
ALTER TABLE "public"."CivicReport" ADD COLUMN     "assignedToWorkerId" TEXT,
ADD COLUMN     "resolvedImageUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."UserQuizProgress" DROP COLUMN "accuracy",
DROP COLUMN "score",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_reportId_key" ON "public"."Notification"("reportId");

-- AddForeignKey
ALTER TABLE "public"."CivicReport" ADD CONSTRAINT "CivicReport_assignedToWorkerId_fkey" FOREIGN KEY ("assignedToWorkerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."CivicReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
