-- Add the author relation to Post (one-to-many: User -> Post).
-- This statement FAILS on a non-empty Post table: you cannot add a
-- NOT NULL column with no default to a table that already has rows.
-- What would those existing posts get as their authorId? Nothing valid.
-- The fix is to wipe the DB (migrate reset) and re-seed.
ALTER TABLE "Post" ADD COLUMN "authorId" INTEGER NOT NULL;

-- When the author is deleted, their posts are deleted too
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for filtering/joining by author
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");