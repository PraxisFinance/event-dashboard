-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resolutionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "odds" TEXT,
    "volume" DECIMAL,
    "liquidity" DECIMAL,
    "participants" INTEGER,
    "source" TEXT NOT NULL,
    "onPlatform" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "contractEventId" TEXT,
    "contractTxHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "eventsFetched" INTEGER,
    "eventsNew" INTEGER,
    "eventsUpdated" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_sourceId_key" ON "Event"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_walletAddress_key" ON "Admin"("walletAddress");
