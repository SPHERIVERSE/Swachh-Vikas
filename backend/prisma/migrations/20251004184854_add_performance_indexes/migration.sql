-- CreateIndex
CREATE INDEX "CivicReport_status_idx" ON "public"."CivicReport"("status");

-- CreateIndex
CREATE INDEX "CivicReport_createdById_idx" ON "public"."CivicReport"("createdById");

-- CreateIndex
CREATE INDEX "CivicReport_assignedToWorkerId_idx" ON "public"."CivicReport"("assignedToWorkerId");

-- CreateIndex
CREATE INDEX "CivicReport_createdAt_idx" ON "public"."CivicReport"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_totalXp_idx" ON "public"."User"("totalXp");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");
