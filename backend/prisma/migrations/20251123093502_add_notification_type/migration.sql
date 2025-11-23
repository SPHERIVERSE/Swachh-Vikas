-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('CIVIC_REPORT_STATUS', 'BID_ACCEPTED', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "type" "public"."NotificationType";
