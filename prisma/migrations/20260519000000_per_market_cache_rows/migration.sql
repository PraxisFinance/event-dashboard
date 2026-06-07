-- DropTable
DROP TABLE "MarketCache";

-- CreateTable
CREATE TABLE "CachedMarket" (
    "id" INTEGER NOT NULL,
    "tradeType" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "liquidity" DOUBLE PRECISION NOT NULL,
    "expirationTimestamp" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "CachedMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheMetadata" (
    "key" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheMetadata_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CachedMarket_tradeType_idx" ON "CachedMarket"("tradeType");

-- CreateIndex
CREATE INDEX "CachedMarket_volume_idx" ON "CachedMarket"("volume" DESC);

-- CreateIndex
CREATE INDEX "CachedMarket_liquidity_idx" ON "CachedMarket"("liquidity" DESC);

-- CreateIndex
CREATE INDEX "CachedMarket_expirationTimestamp_idx" ON "CachedMarket"("expirationTimestamp");
