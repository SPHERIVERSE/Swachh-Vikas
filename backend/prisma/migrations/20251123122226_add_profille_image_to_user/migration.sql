-- AlterEnum
ALTER TYPE "public"."TransactionSource" ADD VALUE 'VOUCHER_CLAIM';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "profileImageUrl" TEXT;
