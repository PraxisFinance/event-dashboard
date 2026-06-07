-- AlterTable
ALTER TABLE "CachedMarket" ADD COLUMN "stableSlug" TEXT;

-- CreateIndex
CREATE INDEX "CachedMarket_stableSlug_idx" ON "CachedMarket"("stableSlug");

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "stableSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vault" TEXT,
    "cpfAddress" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolutionTypeTuple" TEXT,
    "marketType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stableSlug_key" ON "Subscription"("stableSlug");
