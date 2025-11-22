-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('illegal_dumping', 'open_toilet', 'dirty_toilet', 'overflow_dustbin', 'dead_animal', 'fowl', 'public_bin_request', 'public_toilet_request');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('pending', 'escalated', 'resolved');

-- CreateTable
CREATE TABLE "public"."CivicReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "imageUrl" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdById" TEXT NOT NULL,
    "supportCount" INTEGER NOT NULL DEFAULT 0,
    "oppositionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivicReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CivicReport" ADD CONSTRAINT "CivicReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
