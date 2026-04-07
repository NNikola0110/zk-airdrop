-- CreateTable
CREATE TABLE "Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "amountPerClaim" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "Round_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nullifier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nullifierHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundId" INTEGER NOT NULL,
    CONSTRAINT "Nullifier_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "nullifierHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundId" INTEGER NOT NULL,
    CONSTRAINT "Distribution_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Round_campaignId_idx" ON "Round"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Nullifier_nullifierHash_key" ON "Nullifier"("nullifierHash");

-- CreateIndex
CREATE INDEX "Nullifier_roundId_idx" ON "Nullifier"("roundId");

-- CreateIndex
CREATE INDEX "Distribution_roundId_idx" ON "Distribution"("roundId");

-- CreateIndex
CREATE INDEX "Distribution_walletAddress_idx" ON "Distribution"("walletAddress");
