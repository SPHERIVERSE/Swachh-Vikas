-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('EARNED', 'SPENT');

-- CreateEnum
CREATE TYPE "public"."TransactionSource" AS ENUM ('COURSE_COMPLETION', 'REPORT_RESOLUTION', 'SUPPORT_VOTE', 'MARKETPLACE_SALE', 'VOUCHER_PURCHASE');

-- CreateEnum
CREATE TYPE "public"."VoucherStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REDEEMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "cleanCoinBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."CleanCoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "source" "public"."TransactionSource" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT,
    "reportId" TEXT,
    "listingId" TEXT,
    "voucherId" TEXT,

    CONSTRAINT "CleanCoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Voucher" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cleanCoinCost" INTEGER NOT NULL,
    "discountAmount" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "terms" TEXT,
    "expiryDate" TIMESTAMP(3),
    "status" "public"."VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalQuantity" INTEGER,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoucherClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VoucherClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleanCoinTransaction_userId_idx" ON "public"."CleanCoinTransaction"("userId");

-- CreateIndex
CREATE INDEX "CleanCoinTransaction_createdAt_idx" ON "public"."CleanCoinTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CleanCoinTransaction_source_idx" ON "public"."CleanCoinTransaction"("source");

-- CreateIndex
CREATE INDEX "Voucher_businessId_idx" ON "public"."Voucher"("businessId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "public"."Voucher"("status");

-- CreateIndex
CREATE INDEX "Voucher_createdAt_idx" ON "public"."Voucher"("createdAt");

-- CreateIndex
CREATE INDEX "VoucherClaim_userId_idx" ON "public"."VoucherClaim"("userId");

-- CreateIndex
CREATE INDEX "VoucherClaim_voucherId_idx" ON "public"."VoucherClaim"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherClaim_claimedAt_idx" ON "public"."VoucherClaim"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherClaim_userId_voucherId_key" ON "public"."VoucherClaim"("userId", "voucherId");

-- AddForeignKey
ALTER TABLE "public"."CleanCoinTransaction" ADD CONSTRAINT "CleanCoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voucher" ADD CONSTRAINT "Voucher_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherClaim" ADD CONSTRAINT "VoucherClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherClaim" ADD CONSTRAINT "VoucherClaim_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
