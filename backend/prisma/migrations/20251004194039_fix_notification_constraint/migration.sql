-- DropIndex
DROP INDEX "public"."Notification_reportId_userId_key";

-- CreateIndex
CREATE INDEX "Notification_reportId_idx" ON "public"."Notification"("reportId");
