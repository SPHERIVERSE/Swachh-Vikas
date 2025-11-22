-- CreateTable
CREATE TABLE "public"."community_polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postId" TEXT NOT NULL,

    CONSTRAINT "community_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_poll_votes" (
    "id" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "community_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_poll_votes_userId_pollId_key" ON "public"."community_poll_votes"("userId", "pollId");

-- AddForeignKey
ALTER TABLE "public"."community_polls" ADD CONSTRAINT "community_polls_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_poll_votes" ADD CONSTRAINT "community_poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_poll_votes" ADD CONSTRAINT "community_poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."community_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
