-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "csvBatchId" UUID;

-- CreateTable
CREATE TABLE "ApiConnection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "mode" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    "tokenCiphertext" TEXT,
    "cursor" VARCHAR(500),
    "lastSyncAt" TIMESTAMPTZ(6),
    "retryAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApiConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" VARCHAR(40),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "externalId" VARCHAR(200) NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceUrl" VARCHAR(500) NOT NULL,
    "sourceUpdatedAt" TIMESTAMPTZ(6) NOT NULL,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExternalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvImportBatch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "digest" VARCHAR(64) NOT NULL,
    "filename" VARCHAR(120) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "plan" JSONB NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "duplicateCount" INTEGER NOT NULL,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsvImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvImportKey" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "externalKey" VARCHAR(64) NOT NULL,
    "payloadHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsvImportKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiConnection_id_userId_key" ON "ApiConnection"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiConnection_userId_provider_mode_key" ON "ApiConnection"("userId", "provider", "mode");

-- CreateIndex
CREATE INDEX "SyncLog_userId_connectionId_createdAt_idx" ON "SyncLog"("userId", "connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalRecord_userId_connectionId_fetchedAt_idx" ON "ExternalRecord"("userId", "connectionId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRecord_userId_connectionId_externalId_key" ON "ExternalRecord"("userId", "connectionId", "externalId");

-- CreateIndex
CREATE INDEX "CsvImportBatch_userId_createdAt_idx" ON "CsvImportBatch"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CsvImportBatch_id_userId_key" ON "CsvImportBatch"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CsvImportBatch_userId_accountId_digest_key" ON "CsvImportBatch"("userId", "accountId", "digest");

-- CreateIndex
CREATE UNIQUE INDEX "CsvImportKey_userId_accountId_externalKey_key" ON "CsvImportKey"("userId", "accountId", "externalKey");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_csvBatchId_userId_fkey" FOREIGN KEY ("csvBatchId", "userId") REFERENCES "CsvImportBatch"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_connectionId_userId_fkey" FOREIGN KEY ("connectionId", "userId") REFERENCES "ApiConnection"("id", "userId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExternalRecord" ADD CONSTRAINT "ExternalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRecord" ADD CONSTRAINT "ExternalRecord_connectionId_userId_fkey" FOREIGN KEY ("connectionId", "userId") REFERENCES "ApiConnection"("id", "userId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CsvImportBatch" ADD CONSTRAINT "CsvImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvImportBatch" ADD CONSTRAINT "CsvImportBatch_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CsvImportKey" ADD CONSTRAINT "CsvImportKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvImportKey" ADD CONSTRAINT "CsvImportKey_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CsvImportKey" ADD CONSTRAINT "CsvImportKey_batchId_userId_fkey" FOREIGN KEY ("batchId", "userId") REFERENCES "CsvImportBatch"("id", "userId") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ApiConnection" ENABLE ROW LEVEL SECURITY;ALTER TABLE "ApiConnection" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "ApiConnection" FROM anon,authenticated;CREATE POLICY integration_owner ON "ApiConnection" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");

ALTER TABLE "SyncLog" ENABLE ROW LEVEL SECURITY;ALTER TABLE "SyncLog" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "SyncLog" FROM anon,authenticated;CREATE POLICY integration_owner ON "SyncLog" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");

ALTER TABLE "ExternalRecord" ENABLE ROW LEVEL SECURITY;ALTER TABLE "ExternalRecord" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "ExternalRecord" FROM anon,authenticated;CREATE POLICY integration_owner ON "ExternalRecord" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");

ALTER TABLE "CsvImportBatch" ENABLE ROW LEVEL SECURITY;ALTER TABLE "CsvImportBatch" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "CsvImportBatch" FROM anon,authenticated;CREATE POLICY integration_owner ON "CsvImportBatch" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");

ALTER TABLE "CsvImportKey" ENABLE ROW LEVEL SECURITY;ALTER TABLE "CsvImportKey" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "CsvImportKey" FROM anon,authenticated;CREATE POLICY integration_owner ON "CsvImportKey" FOR ALL USING ((SELECT auth.uid())="userId") WITH CHECK ((SELECT auth.uid())="userId");

ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_provider_valid" CHECK(provider IN ('google-calendar','gmail','github','canvas','google-drive'));
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_mode_valid" CHECK(mode IN ('mock','live'));
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_status_valid" CHECK(status IN ('disconnected','authorized','syncing','healthy','error','rate_limited'));
ALTER TABLE "ExternalRecord" ADD CONSTRAINT "ExternalRecord_kind_valid" CHECK(kind IN ('Event','Note','Project','Assignment'));
ALTER TABLE "CsvImportBatch" ADD CONSTRAINT "CsvImportBatch_counts_valid" CHECK("rowCount" BETWEEN 1 AND 200 AND "duplicateCount" BETWEEN 0 AND "rowCount" AND "importedCount">=0 AND "skippedCount">=0);
CREATE POLICY integration_audit_insert ON "AuditLog" FOR INSERT WITH CHECK((SELECT auth.uid())="userId" AND action LIKE 'integration.%' AND outcome='success');

ALTER TABLE "ApiConnection" ADD COLUMN selection JSONB NOT NULL DEFAULT '{}', ADD COLUMN "leaseToken" UUID, ADD COLUMN "leaseUntil" TIMESTAMPTZ(6), ADD COLUMN "consentedAt" TIMESTAMPTZ(6);

ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_status_valid" CHECK(status IN ('healthy','rate_limited','error') AND "recordCount">=0);
ALTER TABLE "CsvImportKey" ADD CONSTRAINT "CsvImportKey_hash_valid" CHECK("externalKey" ~ '^[a-f0-9]{64}$' AND "payloadHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "CsvImportBatch" ADD CONSTRAINT "CsvImportBatch_integrity" CHECK(digest ~ '^[a-f0-9]{64}$' AND currency IN ('USD','CAD','EUR','GBP') AND "importedCount"+"skippedCount"<="rowCount" AND ("importedAt" IS NULL OR "importedCount"+"skippedCount"="rowCount"));
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_credential_integrity" CHECK(("tokenCiphertext" IS NULL OR "tokenCiphertext" LIKE 'v1.%') AND (("leaseToken" IS NULL)=("leaseUntil" IS NULL)) AND (mode='mock' OR "tokenCiphertext" IS NULL OR "consentedAt" IS NOT NULL));
