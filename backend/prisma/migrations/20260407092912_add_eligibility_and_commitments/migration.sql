-- CreateTable
CREATE TABLE "Eligibility" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubLogin" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "Eligibility_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdentityCommitment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubLogin" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "IdentityCommitment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Eligibility_githubLogin_idx" ON "Eligibility"("githubLogin");

-- CreateIndex
CREATE INDEX "Eligibility_campaignId_idx" ON "Eligibility"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityCommitment_commitment_key" ON "IdentityCommitment"("commitment");

-- CreateIndex
CREATE INDEX "IdentityCommitment_githubLogin_idx" ON "IdentityCommitment"("githubLogin");

-- CreateIndex
CREATE INDEX "IdentityCommitment_campaignId_idx" ON "IdentityCommitment"("campaignId");
