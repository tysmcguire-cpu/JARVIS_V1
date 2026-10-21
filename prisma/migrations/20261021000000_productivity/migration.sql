CREATE TABLE "WorkspaceState" (
 id uuid PRIMARY KEY,
 "userId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 key varchar(160) NOT NULL,
 value jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 "updatedAt" timestamptz NOT NULL DEFAULT now(),
 UNIQUE("userId",key),
 CHECK(octet_length(value::text)<=1600000)
);
ALTER TABLE "WorkspaceState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceState" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "WorkspaceState" FROM anon,authenticated;
CREATE POLICY workspace_owner ON "WorkspaceState" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='jarvis_app') THEN
 GRANT SELECT,INSERT,UPDATE,DELETE ON "WorkspaceState" TO jarvis_app;
 END IF;
END $$;

ALTER TABLE "Transaction" ADD COLUMN "transferGroup" uuid;
CREATE INDEX "Transaction_owner_transfer" ON "Transaction"("userId","transferGroup") WHERE "transferGroup" IS NOT NULL;

ALTER TABLE "Event" ADD COLUMN "seriesId" uuid;
CREATE INDEX "Event_owner_series" ON "Event"("userId","seriesId");

-- All writers, including Telegram, participate in reconciliation's account lock.
CREATE FUNCTION lock_ledger_accounts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM id FROM "FinancialAccount" WHERE id=NEW."accountId" AND "userId"=NEW."userId" FOR UPDATE;
 ELSIF TG_OP='DELETE' THEN
  PERFORM id FROM "FinancialAccount" WHERE id=OLD."accountId" AND "userId"=OLD."userId" FOR UPDATE;
 ELSE
  PERFORM id FROM "FinancialAccount" WHERE id IN(OLD."accountId",NEW."accountId") AND "userId"=NEW."userId" ORDER BY id FOR UPDATE;
  IF NEW."transferGroup" IS DISTINCT FROM OLD."transferGroup" OR OLD."transferGroup" IS NOT NULL THEN
   RAISE EXCEPTION 'Replace a transfer as a pair';
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER ledger_account_lock BEFORE INSERT OR UPDATE OR DELETE ON "Transaction" FOR EACH ROW EXECUTE FUNCTION lock_ledger_accounts();

CREATE FUNCTION validate_transfer_pair() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE group_id uuid; owner_id uuid; n integer; valid boolean;
BEGIN
 IF TG_OP='DELETE' THEN group_id=OLD."transferGroup";owner_id=OLD."userId";
 ELSE group_id=NEW."transferGroup";owner_id=NEW."userId"; END IF;
 IF group_id IS NULL THEN RETURN NULL; END IF;
 SELECT count(*),count(DISTINCT t."accountId")=2 AND count(DISTINCT a.currency)=1
  AND count(DISTINCT t.amount)=1 AND min(t.amount)>0 AND count(DISTINCT t.date)=1
  AND count(*) FILTER(WHERE c.kind='income')=1 AND count(*) FILTER(WHERE c.kind='expense')=1
 INTO n,valid FROM "Transaction" t JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId"
 JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=owner_id AND t."transferGroup"=group_id;
 IF n<>0 AND (n<>2 OR NOT valid) THEN RAISE EXCEPTION 'A transfer requires a matching same-currency pair'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER ledger_transfer_pair AFTER INSERT OR UPDATE OR DELETE ON "Transaction" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_transfer_pair();

CREATE UNIQUE INDEX "Event_series_occurrence" ON "Event"("userId","seriesId","startDate") WHERE "seriesId" IS NOT NULL;
