-- CreateTable
CREATE TABLE "public"."CivicReportSupport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CivicReportSupport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CivicReportSupport_reportId_userId_key" ON "public"."CivicReportSupport"("reportId", "userId");

-- AddForeignKey
ALTER TABLE "public"."CivicReportSupport" ADD CONSTRAINT "CivicReportSupport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."CivicReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CivicReportSupport" ADD CONSTRAINT "CivicReportSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
