-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('ISSUED', 'REDEEMED');

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "CertStatus" NOT NULL DEFAULT 'ISSUED',
    "title" TEXT NOT NULL DEFAULT 'Прогулка на катере, 1 час',
    "issuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT,
    "redeemedAt" TIMESTAMPTZ(3),
    "redeemedBy" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_number_key" ON "Certificate"("number");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- CreateIndex
CREATE INDEX "Certificate_issuedAt_idx" ON "Certificate"("issuedAt");
