-- CreateTable
CREATE TABLE "BotDraft" (
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BotDraft_pkey" PRIMARY KEY ("chatId")
);

-- CreateIndex
CREATE INDEX "BotDraft_updatedAt_idx" ON "BotDraft"("updatedAt");
