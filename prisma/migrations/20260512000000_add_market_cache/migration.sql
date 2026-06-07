-- CreateTable
CREATE TABLE "MarketCache" (
    "key" TEXT NOT NULL,
    "markets" JSONB NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketCache_pkey" PRIMARY KEY ("key")
);
