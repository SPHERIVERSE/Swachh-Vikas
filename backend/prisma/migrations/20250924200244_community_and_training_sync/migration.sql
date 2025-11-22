/*
  Warnings:

  - You are about to drop the column `description` on the `TrainingModule` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `TrainingModule` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `UserVideoProgress` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `UserVideoProgress` table. All the data in the column will be lost.
  - The required column `id` was added to the `CivicReportSupport` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `role` to the `TrainingModule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CivicReport" ADD COLUMN     "oppositionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supportCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."CivicReportSupport" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "CivicReportSupport_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."TrainingModule" DROP COLUMN "description",
DROP COLUMN "level",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" "public"."Role" NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserFlashcardProgress" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."UserModuleProgress" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."UserQuizProgress" ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "score" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserVideoProgress" DROP COLUMN "completed",
DROP COLUMN "progress",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "watched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Video" ALTER COLUMN "duration" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."QuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
