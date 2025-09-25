/*
  Warnings:

  - You are about to drop the column `question` on the `QuizQuestion` table. All the data in the column will be lost.
    **[Data Loss Prevention]** The SQL below includes an UPDATE statement to prevent this loss.

*/
-- AlterTable
ALTER TABLE "public"."Quiz" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

-- AlterTable (Prisma adds new columns and drops old ones)
ALTER TABLE "public"."QuizQuestion"
ADD COLUMN "text" TEXT NOT NULL DEFAULT '',
ADD COLUMN "xpAward" INTEGER NOT NULL DEFAULT 1;

-- 💥 CRITICAL FIX: DATA MIGRATION STEP 💥
-- Copy existing data from the old 'question' column to the new 'text' column.
UPDATE "public"."QuizQuestion" SET "text" = "question";

-- AlterTable (Now it is safe to drop the old column)
ALTER TABLE "public"."QuizQuestion" DROP COLUMN "question";

-- AlterTable
ALTER TABLE "public"."UserQuizProgress" ADD COLUMN "score" INTEGER;

-- This is the end of the required SQL.
