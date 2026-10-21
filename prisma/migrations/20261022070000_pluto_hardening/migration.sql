ALTER TABLE "PlanCatalog" ADD COLUMN "recordLimit" int NOT NULL DEFAULT 5000 CHECK("recordLimit">0),ADD COLUMN "storageBytes" bigint NOT NULL DEFAULT 10485760 CHECK("storageBytes">0),ADD COLUMN "operationsMinute" int NOT NULL DEFAULT 120 CHECK("operationsMinute">0),ADD COLUMN "operationsDay" int NOT NULL DEFAULT 5000 CHECK("operationsDay">0);
UPDATE "PlanCatalog" SET "recordLimit"=CASE id WHEN 'plus' THEN 25000 WHEN 'pro' THEN 100000 WHEN 'ultimate' THEN 200000 ELSE 5000 END,"storageBytes"=CASE id WHEN 'plus' THEN 104857600 WHEN 'pro' THEN 524288000 WHEN 'ultimate' THEN 1073741824 ELSE 10485760 END,"operationsMinute"=CASE id WHEN 'free' THEN 120 ELSE 300 END,"operationsDay"=CASE id WHEN 'free' THEN 5000 ELSE 25000 END;
CREATE TABLE "CustomerStorage"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,records bigint NOT NULL DEFAULT 0,bytes bigint NOT NULL DEFAULT 0,CHECK(records>=0 AND bytes>=0));
CREATE TABLE "StoragePolicy"(id boolean PRIMARY KEY DEFAULT true CHECK(id),"maxBytes" bigint NOT NULL DEFAULT 134217728 CHECK("maxBytes">0),"usedBytes" bigint NOT NULL DEFAULT 0 CHECK("usedBytes">=0));
INSERT INTO "StoragePolicy"(id)VALUES(true);
CREATE TABLE "CustomerRequestWindow"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,minute timestamptz NOT NULL,day date NOT NULL,"minuteCount" int NOT NULL,"dayCount" int NOT NULL);
CREATE TABLE "MaintenanceState"(id boolean PRIMARY KEY DEFAULT true CHECK(id),"nextAt" timestamptz NOT NULL DEFAULT now());
INSERT INTO "MaintenanceState"(id)VALUES(true);
ALTER TABLE "MaintenanceState" ENABLE ROW LEVEL SECURITY;ALTER TABLE "MaintenanceState" FORCE ROW LEVEL SECURITY;REVOKE ALL ON "MaintenanceState" FROM PUBLIC,anon,authenticated,pluto_app,pluto_worker;
CREATE INDEX audit_retention_time ON "AuditLog"("createdAt");
CREATE INDEX sync_retention_time ON "SyncLog"("createdAt");
CREATE INDEX admin_access_retention_time ON "AdminAccess"("createdAt");
DO $$ DECLARE tab text;BEGIN FOREACH tab IN ARRAY ARRAY['CustomerStorage','StoragePolicy','CustomerRequestWindow'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',tab);EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated,pluto_app,pluto_worker,pluto_billing',tab);END LOOP;END $$;
GRANT SELECT ON "CustomerStorage" TO pluto_app;
CREATE POLICY storage_self ON "CustomerStorage" FOR SELECT TO pluto_app USING("userId"=auth.uid() AND EXISTS(SELECT 1 FROM "User" WHERE id=auth.uid() AND status='active'));
CREATE FUNCTION public.pluto_request_budget() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET timezone='UTC' AS $$
DECLARE actor uuid:=auth.uid();tier text;limits public."PlanCatalog";v public."CustomerRequestWindow";BEGIN
 SELECT plan INTO tier FROM public."Subscription" WHERE "userId"=actor AND status='active' AND "periodEnd">now() AND "syncedAt">now()-interval '24 hours';SELECT * INTO limits FROM public."PlanCatalog" WHERE id=COALESCE(tier,'free') AND enabled;IF NOT FOUND THEN SELECT * INTO limits FROM public."PlanCatalog" WHERE id='free' AND enabled;END IF;IF NOT FOUND THEN RAISE EXCEPTION 'Plan catalog unavailable';END IF;
 PERFORM 1 FROM public."User" WHERE id=actor AND status='active' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Customer unavailable';END IF;
 INSERT INTO public."CustomerRequestWindow"("userId",minute,day,"minuteCount","dayCount")VALUES(actor,date_trunc('minute',now()),current_date,1,1)ON CONFLICT("userId")DO UPDATE SET minute=EXCLUDED.minute,day=EXCLUDED.day,"minuteCount"=CASE WHEN public."CustomerRequestWindow".minute=EXCLUDED.minute THEN public."CustomerRequestWindow"."minuteCount"+1 ELSE 1 END,"dayCount"=CASE WHEN public."CustomerRequestWindow".day=EXCLUDED.day THEN public."CustomerRequestWindow"."dayCount"+1 ELSE 1 END RETURNING * INTO v;
 IF v."minuteCount">limits."operationsMinute" OR v."dayCount">limits."operationsDay" THEN RAISE EXCEPTION 'Temporary operation limit reached';END IF;
END $$;
REVOKE ALL ON FUNCTION public.pluto_request_budget() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pluto_request_budget() TO pluto_app;
CREATE FUNCTION public.pluto_storage_budget() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid;delta_records int:=0;delta_bytes bigint:=0;tier text;limits public."PlanCatalog";used public."CustomerStorage";total bigint;max_total bigint;BEGIN
 IF TG_OP='INSERT' THEN actor:=NEW."userId";delta_records:=1;delta_bytes:=octet_length(to_jsonb(NEW)::text);
 ELSIF TG_OP='DELETE' THEN actor:=OLD."userId";delta_records:=-1;delta_bytes:=-octet_length(to_jsonb(OLD)::text);
 ELSE actor:=NEW."userId";IF actor<>OLD."userId" THEN RAISE EXCEPTION 'Record ownership is immutable';END IF;delta_bytes:=octet_length(to_jsonb(NEW)::text)-octet_length(to_jsonb(OLD)::text);END IF;
 -- Parent erasure may already have cascaded the aggregate row. Never recreate it.
 IF TG_OP='DELETE' THEN UPDATE public."CustomerStorage" SET records=GREATEST(0,records+delta_records),bytes=GREATEST(0,bytes+delta_bytes) WHERE "userId"=actor;
 ELSE
  SELECT plan INTO tier FROM public."Subscription" WHERE "userId"=actor AND status='active' AND "periodEnd">now() AND "syncedAt">now()-interval '24 hours';SELECT * INTO limits FROM public."PlanCatalog" WHERE id=COALESCE(tier,'free') AND enabled;IF NOT FOUND THEN SELECT * INTO limits FROM public."PlanCatalog" WHERE id='free' AND enabled;END IF;IF NOT FOUND THEN RAISE EXCEPTION 'Plan catalog unavailable';END IF;
  IF TG_OP='INSERT' THEN INSERT INTO public."CustomerStorage"("userId",records,bytes)VALUES(actor,delta_records,delta_bytes)ON CONFLICT("userId")DO UPDATE SET records=public."CustomerStorage".records+delta_records,bytes=public."CustomerStorage".bytes+delta_bytes RETURNING * INTO used;
  ELSE UPDATE public."CustomerStorage" SET bytes=bytes+delta_bytes WHERE "userId"=actor RETURNING * INTO used;END IF;
  IF (delta_records>0 OR delta_bytes>0) AND (used.records>limits."recordLimit" OR used.bytes>limits."storageBytes") THEN RAISE EXCEPTION 'Workspace storage limit reached; export or remove old records';END IF;
 END IF;
 UPDATE public."StoragePolicy" SET "usedBytes"=GREATEST(0,"usedBytes"+delta_bytes) WHERE id=true RETURNING "usedBytes","maxBytes" INTO total,max_total;
 IF delta_bytes>0 AND total>max_total THEN RAISE EXCEPTION 'Service storage capacity reached';END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.pluto_storage_budget() FROM PUBLIC;
DO $$ DECLARE tab text;BEGIN
 FOREACH tab IN ARRAY ARRAY['FinancialAccount','Category','Transaction','Budget','BudgetCategory','RecurringExpense','Course','Assignment','Exam','Grade','StudySession','Event','Task','Reminder','CareerApplication','Contact','FollowUp','Project','Milestone','ProjectActivity','Goal','Habit','HabitEntry','Note','ExternalRecord','WorkspaceState','ChatThread','ChatTurn','WeeklyReport','ResearchResult','VoiceSession','VoiceTurn','AiConversation','AiSourceReference','TelegramMessage','CsvImportBatch','CsvImportKey'] LOOP
  EXECUTE format('INSERT INTO public."CustomerStorage"("userId",records,bytes)SELECT "userId",count(*),sum(octet_length(to_jsonb(t)::text)) FROM public.%I t GROUP BY "userId" ON CONFLICT("userId")DO UPDATE SET records=public."CustomerStorage".records+EXCLUDED.records,bytes=public."CustomerStorage".bytes+EXCLUDED.bytes',tab);
  EXECUTE format('CREATE TRIGGER pluto_storage_budget AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.pluto_storage_budget()',tab);
 END LOOP;
 UPDATE public."StoragePolicy" SET "usedBytes"=(SELECT COALESCE(sum(bytes),0) FROM public."CustomerStorage") WHERE id=true;
END $$;
CREATE FUNCTION public.pluto_maintenance() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 UPDATE public."MaintenanceState" SET "nextAt"=now()+interval '10 minutes' WHERE id=true AND "nextAt"<=now();IF NOT FOUND THEN RETURN;END IF;
 DELETE FROM public."ProductActivity" WHERE day<current_date-90;
 DELETE FROM public."AdminAccess" WHERE "createdAt"<now()-interval '180 days';
 DELETE FROM public."AuditLog" WHERE "createdAt"<now()-interval '90 days';
 DELETE FROM public."SyncLog" WHERE "createdAt"<now()-interval '90 days';
 DELETE FROM public."TelegramPairing" WHERE "expiresAt"<now()-interval '1 day';
 DELETE FROM public."CsvImportBatch" WHERE "createdAt"<now()-interval '7 days' AND "importedAt" IS NULL;
 UPDATE public."VoiceTurn" SET status='failed' WHERE status='generating' AND "createdAt"<now()-interval '5 minutes';
END $$;
REVOKE ALL ON FUNCTION public.pluto_maintenance() FROM PUBLIC,anon,authenticated,pluto_app;
GRANT EXECUTE ON FUNCTION public.pluto_maintenance() TO pluto_worker;
CREATE FUNCTION public.pluto_assert_installation(expected text) RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN IF expected IS NULL OR NOT EXISTS(SELECT 1 FROM public."PlutoInstallation" WHERE id=true AND "projectRef"=expected) THEN RAISE EXCEPTION 'Commercial installation identity is not initialized or does not match';END IF;END $$;
REVOKE ALL ON FUNCTION public.pluto_assert_installation(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pluto_assert_installation(text) TO pluto_app,pluto_billing,pluto_admin,pluto_admin_api,pluto_erasure;
