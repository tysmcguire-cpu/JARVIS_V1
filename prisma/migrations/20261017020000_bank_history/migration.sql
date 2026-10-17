ALTER TABLE "ApiConnection" DROP CONSTRAINT "ApiConnection_provider_valid";
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_provider_valid" CHECK(provider IN ('google-calendar','apple-calendar','github','canvas','gmail','google-drive','plaid'));
ALTER TABLE "ExternalRecord" DROP CONSTRAINT "ExternalRecord_kind_valid";
ALTER TABLE "ExternalRecord" ADD CONSTRAINT "ExternalRecord_kind_valid" CHECK(kind IN ('Event','Note','Project','Assignment','BankAccount','BankTransaction'));
CREATE INDEX "ExternalRecord_bank_history_idx" ON "ExternalRecord"("userId","connectionId",kind,((payload->>'date'))) WHERE deleted=false AND kind IN ('BankAccount','BankTransaction');
