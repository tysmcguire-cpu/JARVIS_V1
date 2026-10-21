BEGIN;
CREATE TABLE "PlanCatalog"(id varchar(20) PRIMARY KEY,"monthlyPriceMinor" integer NOT NULL CHECK("monthlyPriceMinor">=0),enabled boolean NOT NULL,"messages" integer NOT NULL,"tokens" bigint NOT NULL,"voiceSeconds" integer NOT NULL,"researchCalls" integer NOT NULL,"reportsPerWeek" integer NOT NULL,"concurrency" integer NOT NULL,"spendMicros" bigint NOT NULL);
INSERT INTO "PlanCatalog" VALUES('free',0,true,15,30000,0,0,0,1,100000),('plus',999,true,250,1000000,900,20,1,2,2000000),('pro',1999,true,1000,4000000,5400,100,1,3,6000000),('ultimate',3999,false,2500,10000000,10800,250,1,4,12000000);
CREATE TABLE "BudgetPolicy"(id boolean PRIMARY KEY DEFAULT true CHECK(id),enabled boolean NOT NULL DEFAULT false,"monthlySpendMicros" bigint NOT NULL DEFAULT 0 CHECK("monthlySpendMicros">=0));
INSERT INTO "BudgetPolicy"(id) VALUES(true);
CREATE TABLE "BillingCustomer"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,"stripeCustomerId" varchar(100) NOT NULL UNIQUE,livemode boolean NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"reconciledAt" timestamptz,UNIQUE("userId","stripeCustomerId"));
CREATE TABLE "Subscription"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,"stripeSubscriptionId" varchar(100) NOT NULL UNIQUE,"stripeCustomerId" varchar(100) NOT NULL,plan varchar(20) NOT NULL REFERENCES "PlanCatalog"(id),status varchar(30) NOT NULL,"periodEnd" timestamptz NOT NULL,"monthlyAmountMicros" bigint NOT NULL CHECK("monthlyAmountMicros">=0),currency char(3) NOT NULL DEFAULT 'USD',"cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,livemode boolean NOT NULL,"syncedAt" timestamptz NOT NULL DEFAULT now(),FOREIGN KEY("userId","stripeCustomerId") REFERENCES "BillingCustomer"("userId","stripeCustomerId") ON DELETE CASCADE);
CREATE TABLE "CheckoutIntent"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,"requestId" uuid NOT NULL UNIQUE,plan varchar(20) NOT NULL,cadence varchar(10) NOT NULL,"expiresAt" timestamptz NOT NULL,"stripeSessionId" varchar(100),url text);
CREATE TABLE "BillingEvent"(id varchar(100) PRIMARY KEY,kind varchar(100) NOT NULL,"createdAt" timestamptz NOT NULL,"processedAt" timestamptz NOT NULL DEFAULT now(),livemode boolean NOT NULL);
CREATE TABLE "BillingLedger"("objectId" varchar(100) NOT NULL,kind varchar(30) NOT NULL,"userId" uuid REFERENCES "User"(id) ON DELETE SET NULL,amount bigint NOT NULL,currency char(3) NOT NULL,"occurredAt" timestamptz NOT NULL,livemode boolean NOT NULL,PRIMARY KEY("objectId",kind));
CREATE TABLE "RevenueMovement"("eventId" varchar(100) PRIMARY KEY REFERENCES "BillingEvent"(id),"userId" uuid REFERENCES "User"(id) ON DELETE SET NULL,kind varchar(20) NOT NULL,"deltaMicros" bigint NOT NULL,"occurredAt" timestamptz NOT NULL,livemode boolean NOT NULL);
CREATE TABLE "UsageReservation"(id uuid PRIMARY KEY,"userId" uuid REFERENCES "User"(id) ON DELETE SET NULL,"requestKey" varchar(160) NOT NULL,kind varchar(20) NOT NULL CHECK(kind IN('chat','report','research','voice')),plan varchar(20) NOT NULL,"periodStart" date NOT NULL,state varchar(20) NOT NULL DEFAULT 'reserved' CHECK(state IN('reserved','succeeded','failed')),"tokensReserved" bigint NOT NULL,"tokensActual" bigint,"inputTokens" bigint,"outputTokens" bigint,"costReservedMicros" bigint NOT NULL,"costActualMicros" bigint,"voiceReservedSeconds" integer NOT NULL,"voiceActualSeconds" integer,"researchReservedCalls" integer NOT NULL,"researchActualCalls" integer,model varchar(100),"leaseUntil" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"completedAt" timestamptz,UNIQUE("userId","requestKey"));
CREATE INDEX usage_customer_period ON "UsageReservation"("userId","periodStart");
CREATE INDEX usage_global_period ON "UsageReservation"("periodStart");
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='pluto_billing') THEN CREATE ROLE pluto_billing NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;END $$;
GRANT USAGE ON SCHEMA public TO pluto_billing;
DO $$ DECLARE tab text;BEGIN
 FOREACH tab IN ARRAY ARRAY['PlanCatalog','BudgetPolicy','BillingCustomer','Subscription','CheckoutIntent','BillingEvent','BillingLedger','RevenueMovement','UsageReservation'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tab);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tab);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC,anon,authenticated,pluto_app',tab);
 END LOOP;
 FOREACH tab IN ARRAY ARRAY['BillingCustomer','Subscription','CheckoutIntent','BillingLedger','UsageReservation'] LOOP
  EXECUTE format('GRANT SELECT ON %I TO pluto_app',tab);EXECUTE format('CREATE POLICY customer_read ON %I FOR SELECT TO pluto_app USING("userId"=auth.uid())',tab);
 END LOOP;
 FOREACH tab IN ARRAY ARRAY['BillingCustomer','Subscription','CheckoutIntent','BillingEvent','BillingLedger','RevenueMovement'] LOOP
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I TO pluto_billing',tab);EXECUTE format('CREATE POLICY billing_service ON %I FOR ALL TO pluto_billing USING(true) WITH CHECK(true)',tab);
 END LOOP;
END $$;
GRANT SELECT ON "PlanCatalog" TO pluto_app,pluto_billing;
CREATE POLICY read_catalog ON "PlanCatalog" FOR SELECT TO pluto_app,pluto_billing USING(true);
CREATE FUNCTION public.pluto_reserve_usage(request_key text,feature text,reserved_tokens bigint,reserved_cost bigint,voice_seconds integer,research_calls integer) RETURNS TABLE(reservation_id uuid,is_new boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET TimeZone='UTC' AS $$
DECLARE actor uuid:=auth.uid(); period date:=date_trunc('month',now())::date; existing uuid; tier text; limits public."PlanCatalog"%ROWTYPE; budget public."BudgetPolicy"%ROWTYPE; used record; concurrent_count integer; weekly_count integer; global_spend bigint; reservation uuid:=gen_random_uuid();
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public."User" WHERE id=actor AND status='active') THEN RAISE EXCEPTION 'Account unavailable';END IF;
 PERFORM 1 FROM public."User" WHERE id=actor AND status='active' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable';END IF;
 IF length(request_key) NOT BETWEEN 8 AND 160 OR feature NOT IN('chat','report','research','voice') OR reserved_tokens<0 OR reserved_tokens>32000 OR reserved_cost<=0 OR voice_seconds<0 OR voice_seconds>900 OR research_calls<0 OR research_calls>10 THEN RAISE EXCEPTION 'Invalid usage reservation';END IF;
 -- Global then per-customer locks serialize shared budgets across instances.
 PERFORM pg_advisory_xact_lock(hashtext('pluto-budget:'||period::text));PERFORM pg_advisory_xact_lock(hashtext(actor::text||':usage'));
 SELECT id INTO existing FROM public."UsageReservation" WHERE "userId"=actor AND "requestKey"=request_key;
 IF existing IS NOT NULL THEN RETURN QUERY SELECT existing,false;RETURN;END IF;
 SELECT * INTO budget FROM public."BudgetPolicy" WHERE id=true;
 IF NOT budget.enabled THEN RAISE EXCEPTION 'Paid provider budget is disabled';END IF;
 SELECT plan INTO tier FROM public."Subscription" WHERE "userId"=actor AND status='active' AND "periodEnd">now() AND "syncedAt">now()-interval '24 hours';
 tier:=COALESCE(tier,'free');SELECT * INTO limits FROM public."PlanCatalog" WHERE id=tier AND enabled=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Plan unavailable';END IF;
 SELECT count(*) FILTER(WHERE kind='chat') AS messages,COALESCE(sum(COALESCE("tokensActual","tokensReserved")),0) AS tokens,COALESCE(sum(COALESCE("costActualMicros","costReservedMicros")),0) AS cost,COALESCE(sum(COALESCE("voiceActualSeconds","voiceReservedSeconds")),0) AS voice,COALESCE(sum(COALESCE("researchActualCalls","researchReservedCalls")),0) AS research INTO used FROM public."UsageReservation" WHERE "userId"=actor AND "periodStart"=period;
 SELECT count(*) INTO concurrent_count FROM public."UsageReservation" WHERE "userId"=actor AND state='reserved' AND "leaseUntil">now();
 SELECT count(*) INTO weekly_count FROM public."UsageReservation" WHERE "userId"=actor AND kind='report' AND state<>'failed' AND "createdAt">=date_trunc('week',now());
 SELECT COALESCE(sum(COALESCE("costActualMicros","costReservedMicros")),0) INTO global_spend FROM public."UsageReservation" WHERE "periodStart"=period;
 IF (feature='chat' AND used.messages>=limits.messages) OR used.tokens+reserved_tokens>limits.tokens OR used.cost+reserved_cost>limits."spendMicros" OR used.voice+voice_seconds>limits."voiceSeconds" OR used.research+research_calls>limits."researchCalls" OR (feature='report' AND weekly_count>=limits."reportsPerWeek") OR (feature='voice' AND (limits."voiceSeconds"=0 OR voice_seconds=0)) OR (feature='research' AND (limits."researchCalls"=0 OR research_calls=0)) OR concurrent_count>=limits.concurrency OR global_spend+reserved_cost>budget."monthlySpendMicros" THEN RAISE EXCEPTION 'Usage limit reached';END IF;
 INSERT INTO public."UsageReservation"(id,"userId","requestKey",kind,plan,"periodStart","tokensReserved","costReservedMicros","voiceReservedSeconds","researchReservedCalls","leaseUntil") VALUES(reservation,actor,request_key,feature,tier,period,reserved_tokens,reserved_cost,voice_seconds,research_calls,now()+interval '2 minutes');
 RETURN QUERY SELECT reservation,true;
END $$;
CREATE FUNCTION public.pluto_settle_usage(reservation uuid,succeeded boolean,input_tokens bigint,output_tokens bigint,cost_micros bigint,voice_seconds integer,research_calls integer,model_name text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET TimeZone='UTC' AS $$
DECLARE actor uuid:=auth.uid(); item public."UsageReservation"%ROWTYPE;
BEGIN
 SELECT * INTO item FROM public."UsageReservation" WHERE id=reservation AND "userId"=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation unavailable';END IF;
 IF item.state<>'reserved' THEN RETURN false;END IF;
 IF input_tokens<0 OR output_tokens<0 OR input_tokens+output_tokens>item."tokensReserved" OR cost_micros<0 OR cost_micros>item."costReservedMicros" OR voice_seconds<0 OR voice_seconds>item."voiceReservedSeconds" OR research_calls<0 OR research_calls>item."researchReservedCalls" OR length(model_name)>100 THEN RAISE EXCEPTION 'Usage exceeded reservation';END IF;
 UPDATE public."UsageReservation" SET state=CASE WHEN succeeded THEN 'succeeded' ELSE 'failed' END,"inputTokens"=input_tokens,"outputTokens"=output_tokens,"tokensActual"=CASE WHEN succeeded THEN input_tokens+output_tokens ELSE NULL END,"costActualMicros"=CASE WHEN succeeded THEN cost_micros ELSE NULL END,"voiceActualSeconds"=CASE WHEN succeeded THEN voice_seconds ELSE NULL END,"researchActualCalls"=CASE WHEN succeeded THEN research_calls ELSE NULL END,model=model_name,"completedAt"=now(),"leaseUntil"=now() WHERE id=reservation;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.pluto_reserve_usage(text,text,bigint,bigint,integer,integer),public.pluto_settle_usage(uuid,boolean,bigint,bigint,bigint,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pluto_reserve_usage(text,text,bigint,bigint,integer,integer),public.pluto_settle_usage(uuid,boolean,bigint,bigint,bigint,integer,integer,text) TO pluto_app;
CREATE FUNCTION public.pluto_billing_customer_active(customer_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET TimeZone='UTC' AS $$
DECLARE customer_status text;BEGIN SELECT status INTO customer_status FROM public."User" WHERE id=customer_id FOR SHARE;IF customer_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Account unavailable';END IF;RETURN true;END $$;
REVOKE ALL ON FUNCTION public.pluto_billing_customer_active(uuid) FROM PUBLIC,anon,authenticated,pluto_app;
GRANT EXECUTE ON FUNCTION public.pluto_billing_customer_active(uuid) TO pluto_billing;
CREATE FUNCTION public.pluto_guard_billing_erasure() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET TimeZone='UTC' AS $$
BEGIN
 IF NEW.status='deleted' AND OLD.status<>'deleted' THEN
  IF EXISTS(SELECT 1 FROM public."CheckoutIntent" WHERE "userId"=NEW.id AND "expiresAt">now()) THEN RAISE EXCEPTION 'Finish or expire pending checkout before deleting account';END IF;
  IF EXISTS(SELECT 1 FROM public."BillingCustomer" WHERE "userId"=NEW.id AND ("reconciledAt" IS NULL OR "reconciledAt"<now()-interval '5 minutes')) THEN RAISE EXCEPTION 'Verify current Stripe state before deleting account';END IF;
  IF EXISTS(SELECT 1 FROM public."UsageReservation" WHERE "userId"=NEW.id AND state='reserved' AND "leaseUntil">now()) THEN RAISE EXCEPTION 'Wait for active requests before account deletion';END IF;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.pluto_guard_billing_erasure() FROM PUBLIC,anon,authenticated,pluto_app;
CREATE TRIGGER pluto_billing_erasure BEFORE UPDATE OF status ON "User" FOR EACH ROW EXECUTE FUNCTION public.pluto_guard_billing_erasure();
COMMIT;
