-- AlterEnum
ALTER TYPE "public"."TransactionSource" ADD VALUE IF NOT EXISTS 'QUIZ_COMPLETION';

-- AlterTable
ALTER TABLE "public"."AwarenessQuiz" ADD COLUMN     "cleanCoinReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetRole" "public"."Role";

-- CreateIndex
CREATE INDEX "AwarenessQuiz_targetRole_idx" ON "public"."AwarenessQuiz"("targetRole");

-- CreateIndex
CREATE INDEX "AwarenessQuiz_endDate_idx" ON "public"."AwarenessQuiz"("endDate");
