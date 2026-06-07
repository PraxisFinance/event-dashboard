-- AlterTable
ALTER TABLE "CachedMarket"
  ADD COLUMN "createdAt" TIMESTAMP(3);

-- Backfill cached rows from the stored Source payload when available.
UPDATE "CachedMarket"
SET "createdAt" = ("data"->>'createdAt')::timestamp(3)
WHERE "data"->>'createdAt' IS NOT NULL;

-- AlterTable
ALTER TABLE "Subscription"
  ADD COLUMN "lastDeployedSlug" TEXT,
  ADD COLUMN "lastDeployedMarketCreatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkerState"
  ADD COLUMN "lastSourceMarketCreatedAt" TIMESTAMP(3);

-- Avoid deploying historical rounds immediately after migrating an id-based cursor.
UPDATE "WorkerState"
SET "lastSourceMarketCreatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscriptions:source'
  AND "lastSourceMarketId" IS NOT NULL
  AND "lastSourceMarketCreatedAt" IS NULL;

ALTER TABLE "WorkerState"
  DROP COLUMN "lastSourceMarketId";

-- CreateIndex
CREATE INDEX "CachedMarket_createdAt_idx" ON "CachedMarket"("createdAt");
