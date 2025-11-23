/*
  Warnings:

  - You are about to drop the column `targetRole` on the `AwarenessQuiz` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."AwarenessQuiz_endDate_idx";

-- DropIndex
DROP INDEX "public"."AwarenessQuiz_targetRole_idx";

-- AlterTable
ALTER TABLE "public"."AwarenessQuiz" DROP COLUMN "targetRole";
