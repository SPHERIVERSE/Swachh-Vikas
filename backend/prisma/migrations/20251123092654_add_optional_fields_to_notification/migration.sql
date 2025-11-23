-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_reportId_fkey";

-- AlterTable
ALTER TABLE "public"."Notification" ALTER COLUMN "reportId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."CivicReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
