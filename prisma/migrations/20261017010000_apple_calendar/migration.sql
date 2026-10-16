ALTER TABLE "ApiConnection" DROP CONSTRAINT "ApiConnection_provider_valid";
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_provider_valid" CHECK(provider IN ('google-calendar','apple-calendar','github','canvas','gmail','google-drive'));
