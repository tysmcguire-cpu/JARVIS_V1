-- CreateTable
CREATE TABLE "TelegramIdentity" (
    "userId" UUID NOT NULL,
    "botId" VARCHAR(30) NOT NULL,
    "telegramUserId" VARCHAR(30) NOT NULL,
    "chatId" VARCHAR(30) NOT NULL,
    "pairedAt" TIMESTAMPTZ(6),
    "pairingHash" VARCHAR(64),
    "pairingExpiresAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TelegramIdentity_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TelegramMessage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "botId" VARCHAR(30) NOT NULL,
    "updateId" BIGINT NOT NULL,
    "command" VARCHAR(30) NOT NULL,
    "reply" VARCHAR(4096) NOT NULL,
    "entity" VARCHAR(30),
    "recordId" UUID,
    "recordVersion" TIMESTAMPTZ(6),
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMPTZ(6),
    "deliveredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramMessage_userId_createdAt_idx" ON "TelegramMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TelegramMessage_userId_deliveredAt_nextAttemptAt_idx" ON "TelegramMessage"("userId", "deliveredAt", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramMessage_userId_botId_updateId_key" ON "TelegramMessage"("userId", "botId", "updateId");

-- AddForeignKey
ALTER TABLE "TelegramIdentity" ADD CONSTRAINT "TelegramIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramMessage" ADD CONSTRAINT "TelegramMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Only the configured owner can access Telegram pairing and processing state.
ALTER TABLE "TelegramIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramIdentity" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TelegramMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramMessage" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "TelegramIdentity","TelegramMessage" FROM anon,authenticated;
CREATE POLICY telegram_identity_owner ON "TelegramIdentity" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");
CREATE POLICY telegram_message_owner ON "TelegramMessage" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");
CREATE POLICY telegram_audit_insert ON "AuditLog" FOR INSERT WITH CHECK ((SELECT auth.uid())="userId" AND action LIKE 'telegram.%' AND outcome='success');
ALTER TABLE "TelegramIdentity" ADD CONSTRAINT "TelegramIdentity_ids_valid" CHECK ("telegramUserId" ~ '^[1-9][0-9]{0,15}$' AND "chatId" ~ '^[1-9][0-9]{0,15}$');
ALTER TABLE "TelegramMessage" ADD CONSTRAINT "TelegramMessage_attempts_valid" CHECK(attempts>=0 AND "updateId">=0);
ALTER TABLE "TelegramMessage" ADD CONSTRAINT "TelegramMessage_undo_target" CHECK ((entity IS NULL AND "recordId" IS NULL AND "recordVersion" IS NULL) OR (entity IN ('Transaction','Task','Reminder','Note') AND "recordId" IS NOT NULL AND "recordVersion" IS NOT NULL));

ALTER TABLE "TelegramMessage" ADD COLUMN "canceledAt" TIMESTAMPTZ(6);
