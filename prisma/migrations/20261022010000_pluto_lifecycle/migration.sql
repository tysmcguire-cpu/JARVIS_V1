BEGIN;
-- Permit row locking of an inactive own profile; WITH CHECK still forbids editing it.
ALTER POLICY customer_self_update ON "User" USING(id=(SELECT auth.uid())) WITH CHECK(id=(SELECT auth.uid()) AND status='active');
CREATE TABLE "CustomerErasure"("userId" uuid PRIMARY KEY,"requestedAt" timestamptz NOT NULL DEFAULT now(),"authDeletedAt" timestamptz,attempts integer NOT NULL DEFAULT 0, "leaseUntil" timestamptz);
ALTER TABLE "CustomerErasure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerErasure" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "CustomerErasure" FROM PUBLIC,anon,authenticated,pluto_app;
DO $$ DECLARE tab text;BEGIN
 FOR tab IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN('User','PlutoInstallation','CustomerErasure','_prisma_migrations') LOOP
  EXECUTE format('CREATE POLICY customer_active ON public.%I AS RESTRICTIVE FOR ALL TO pluto_app USING(EXISTS(SELECT 1 FROM public."User" u WHERE u.id=auth.uid() AND u.status=''active'')) WITH CHECK(EXISTS(SELECT 1 FROM public."User" u WHERE u.id=auth.uid() AND u.status=''active''))',tab);
 END LOOP;
END $$;
CREATE FUNCTION public.pluto_delete_customer_data() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); current_status text; tab text; billed boolean;
BEGIN
 SELECT status INTO current_status FROM public."User" WHERE id=actor FOR UPDATE;
 IF current_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Customer data unavailable';END IF;
 IF EXISTS(SELECT 1 FROM public."ApiConnection" WHERE "userId"=actor AND "tokenCiphertext" IS NOT NULL) THEN RAISE EXCEPTION 'Disconnect and revoke connected accounts before deleting data';END IF;
 IF to_regclass('public."Subscription"') IS NOT NULL THEN
  EXECUTE 'SELECT EXISTS(SELECT 1 FROM public."Subscription" WHERE "userId"=$1 AND status IN(''active'',''trialing'',''past_due'',''unpaid''))' INTO billed USING actor;
  IF billed THEN RAISE EXCEPTION 'Cancel paid subscriptions before account deletion';END IF;
 END IF;
 FOREACH tab IN ARRAY ARRAY['UserSettings','AuditLog','NotificationDelivery','NotificationJob','NotificationRule','AiSourceReference','AiConversation','TelegramMessage','TelegramIdentity','SyncLog','ExternalRecord','ApiConnection','Note','HabitEntry','Habit','Goal','ProjectActivity','Milestone','Project','FollowUp','Contact','CareerApplication','Reminder','Task','Event','StudySession','Grade','Exam','Assignment','Course','RecurringExpense','BudgetCategory','Budget','Transaction','CsvImportKey','CsvImportBatch','Category','FinancialAccount','WorkspaceState'] LOOP
  EXECUTE format('DELETE FROM public.%I WHERE "userId"=$1',tab) USING actor;
 END LOOP;
 UPDATE public."User" SET status='deleted',"displayName"='Deleted customer',"onboardingCompletedAt"=NULL,"updatedAt"=now() WHERE id=actor;
 INSERT INTO public."CustomerErasure"("userId") VALUES(actor) ON CONFLICT("userId") DO NOTHING;
 INSERT INTO public."AuditLog"(id,"userId",action,outcome) VALUES(gen_random_uuid(),actor,'customer.erasure.requested','success');
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.pluto_delete_customer_data() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pluto_delete_customer_data() TO pluto_app;
COMMIT;
