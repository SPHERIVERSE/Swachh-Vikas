-- CreateEnum
CREATE TYPE "public"."BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "licenseNo" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "public"."WasteBid" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" "public"."BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,

    CONSTRAINT "WasteBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteBid_listingId_idx" ON "public"."WasteBid"("listingId");

-- CreateIndex
CREATE INDEX "WasteBid_bidderId_idx" ON "public"."WasteBid"("bidderId");

-- CreateIndex
CREATE INDEX "WasteBid_status_idx" ON "public"."WasteBid"("status");

-- AddForeignKey
ALTER TABLE "public"."WasteBid" ADD CONSTRAINT "WasteBid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."WasteListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteBid" ADD CONSTRAINT "WasteBid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
