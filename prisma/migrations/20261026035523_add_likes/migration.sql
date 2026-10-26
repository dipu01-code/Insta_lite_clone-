-- Explicit many-to-many join table between User and Post (a "like").
-- Composite primary key means the DB itself refuses a second like from the
-- same user on the same post - no JS code needed to guarantee it.
CREATE TABLE "Like" (
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId", "postId")
);

-- Index for "who liked this post" queries.
-- No separate index on userId is needed: the composite PK already covers
-- queries that start with userId.
CREATE INDEX "Like_postId_idx" ON "Like"("postId");

-- On delete, cascade: deleting a user removes their likes; deleting a post
-- removes the likes on it.
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;