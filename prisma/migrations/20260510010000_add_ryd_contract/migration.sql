-- CreateTable
CREATE TABLE "RydContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vault" TEXT NOT NULL,
    "numWinners" INTEGER NOT NULL,
    "minDeposit" TEXT NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RydContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RydContract_address_key" ON "RydContract"("address");
