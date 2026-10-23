-- PRD 10.1: the vector column is created by the init migration; this adds
-- the NOT NULL guarantee Prisma cannot express for an Unsupported column.
ALTER TABLE "CardChunk"
  ADD CONSTRAINT card_chunk_embedding_present
  CHECK (embedding IS NOT NULL);
