-- AlterTable
ALTER TABLE "Subscription"
  ADD COLUMN "lastDeployedSourceId" INTEGER,
  ADD COLUMN "lastCreatedEventId" TEXT,
  ADD COLUMN "lastDeployTxHash" TEXT,
  ADD COLUMN "lastError" TEXT;

-- CreateTable
CREATE TABLE "WorkerState" (
    "key" TEXT NOT NULL,
    "lastSourceMarketId" INTEGER,
    "lastRunAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerState_pkey" PRIMARY KEY ("key")
);
