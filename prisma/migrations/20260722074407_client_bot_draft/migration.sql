-- CreateTable
CREATE TABLE "ClientBotDraft" (
    "chatId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientBotDraft_pkey" PRIMARY KEY ("chatId")
);

-- CreateIndex
CREATE INDEX "ClientBotDraft_updatedAt_idx" ON "ClientBotDraft"("updatedAt");
