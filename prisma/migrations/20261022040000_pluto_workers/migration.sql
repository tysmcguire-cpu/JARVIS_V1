CREATE ROLE pluto_worker NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT pluto_app TO pluto_worker;
CREATE TABLE "TelegramPairing"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,"botId" varchar(30) NOT NULL,hash varchar(64) UNIQUE NOT NULL,"expiresAt" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
ALTER TABLE "TelegramPairing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramPairing" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "TelegramPairing" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON "TelegramPairing" TO pluto_app;
CREATE POLICY pairing_self ON "TelegramPairing" TO pluto_app USING("userId"=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM "User" WHERE id=auth.uid() AND status='active')) WITH CHECK("userId"=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM "User" WHERE id=auth.uid() AND status='active'));
CREATE UNIQUE INDEX telegram_unique_person ON "TelegramIdentity"("botId","telegramUserId");
CREATE UNIQUE INDEX telegram_unique_chat ON "TelegramIdentity"("botId","chatId");
ALTER TABLE "TelegramMessage" ADD COLUMN "leaseToken" uuid;
CREATE TABLE "WorkerLease"("userId" uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,token uuid,"leaseUntil" timestamptz,"nextAt" timestamptz NOT NULL DEFAULT now(),attempts int NOT NULL DEFAULT 0,"lastSuccessAt" timestamptz,"lastFailureAt" timestamptz);
ALTER TABLE "WorkerLease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkerLease" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "WorkerLease" FROM PUBLIC,anon,authenticated,pluto_app;
CREATE FUNCTION public.pluto_claim_workers(batch int) RETURNS TABLE("userId" uuid,token uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 INSERT INTO public."WorkerLease"("userId") SELECT id FROM public."User" WHERE status='active' ON CONFLICT DO NOTHING;
 RETURN QUERY WITH due AS (SELECT w."userId" FROM public."WorkerLease" w JOIN public."User" u ON u.id=w."userId" WHERE u.status='active' AND w."nextAt"<=now() AND (w."leaseUntil" IS NULL OR w."leaseUntil"<now()) ORDER BY w."nextAt",w."userId" LIMIT LEAST(GREATEST(batch,1),10) FOR UPDATE OF w SKIP LOCKED)
 UPDATE public."WorkerLease" w SET token=gen_random_uuid(),"leaseUntil"=now()+interval '5 minutes',attempts=w.attempts+1 FROM due d WHERE w."userId"=d."userId" RETURNING w."userId",w.token;
END $$;
CREATE FUNCTION public.pluto_finish_worker(customer uuid,fence uuid,ok boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public."WorkerLease" SET token=NULL,"leaseUntil"=NULL,"nextAt"=now()+CASE WHEN ok THEN interval '1 minute' ELSE LEAST(interval '1 hour',interval '30 seconds'*power(2,LEAST(attempts,7))) END,attempts=CASE WHEN ok THEN 0 ELSE attempts END,"lastSuccessAt"=CASE WHEN ok THEN now() ELSE "lastSuccessAt" END,"lastFailureAt"=CASE WHEN ok THEN "lastFailureAt" ELSE now() END WHERE "userId"=customer AND token=fence;
 RETURN FOUND;
END $$;
-- The webhook supplies only validated Telegram IDs and a SHA-256 one-time code.
-- Routing is privileged, narrowly scoped and never returns customer records.
CREATE FUNCTION public.pluto_route_telegram(bot text,person text,chat text,code text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE customer uuid; pending public."TelegramPairing"; BEGIN
 IF bot!~'^[0-9]{5,20}$' OR person!~'^[1-9][0-9]{0,15}$' OR chat<>person THEN RETURN NULL;END IF;
 IF code IS NOT NULL THEN
  SELECT * INTO pending FROM public."TelegramPairing" WHERE hash=code AND "botId"=bot AND "expiresAt">now() FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL;END IF;
  SELECT id INTO customer FROM public."User" WHERE id=pending."userId" AND status='active' FOR SHARE;
  IF customer IS NULL THEN RETURN NULL;END IF;
  IF EXISTS(SELECT 1 FROM public."TelegramIdentity" WHERE "botId"=bot AND "telegramUserId"=person AND "userId"<>customer) THEN RETURN NULL;END IF;
  INSERT INTO public."TelegramIdentity"("userId","botId","telegramUserId","chatId","pairedAt","updatedAt") VALUES(customer,bot,person,chat,now(),now()) ON CONFLICT("userId") DO UPDATE SET "botId"=bot,"telegramUserId"=person,"chatId"=chat,"pairedAt"=now(),"pairingHash"=NULL,"pairingExpiresAt"=NULL,"updatedAt"=now();
  DELETE FROM public."TelegramPairing" WHERE "userId"=customer;
  UPDATE public."TelegramMessage" SET "canceledAt"=now() WHERE "userId"=customer AND "deliveredAt" IS NULL;
  INSERT INTO public."AuditLog"(id,"userId",action,outcome) VALUES(gen_random_uuid(),customer,'telegram.pair','success');
  RETURN customer;
 END IF;
 SELECT t."userId" INTO customer FROM public."TelegramIdentity" t JOIN public."User" u ON u.id=t."userId" WHERE t."botId"=bot AND t."telegramUserId"=person AND t."chatId"=chat AND t."pairedAt" IS NOT NULL AND u.status='active';RETURN customer;
END $$;
REVOKE ALL ON FUNCTION public.pluto_claim_workers(int),public.pluto_finish_worker(uuid,uuid,boolean),public.pluto_route_telegram(text,text,text,text) FROM PUBLIC,anon,authenticated,pluto_app;
GRANT EXECUTE ON FUNCTION public.pluto_claim_workers(int),public.pluto_finish_worker(uuid,uuid,boolean),public.pluto_route_telegram(text,text,text,text) TO pluto_worker;
ALTER TABLE "PlanCatalog" ADD COLUMN "integrationMax" int NOT NULL DEFAULT 1 CHECK("integrationMax" BETWEEN 0 AND 20),ADD COLUMN "telegramDaily" int NOT NULL DEFAULT 20 CHECK("telegramDaily" BETWEEN 0 AND 10000);
UPDATE "PlanCatalog" SET "integrationMax"=CASE id WHEN 'plus' THEN 3 WHEN 'pro' THEN 10 WHEN 'ultimate' THEN 20 ELSE 1 END,"telegramDaily"=CASE id WHEN 'plus' THEN 500 WHEN 'pro' THEN 2000 WHEN 'ultimate' THEN 4000 ELSE 20 END;
CREATE FUNCTION public.pluto_erase_worker_data() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN IF NEW.status='deleted' AND OLD.status<>'deleted' THEN DELETE FROM public."TelegramPairing" WHERE "userId"=NEW.id;DELETE FROM public."WorkerLease" WHERE "userId"=NEW.id;END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION public.pluto_erase_worker_data() FROM PUBLIC;
CREATE TRIGGER pluto_erase_worker_data AFTER UPDATE OF status ON "User" FOR EACH ROW EXECUTE FUNCTION public.pluto_erase_worker_data();
CREATE FUNCTION public.pluto_enforce_service_limits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE tier text; cap int; BEGIN
 PERFORM 1 FROM public."User" WHERE id=NEW."userId" AND status='active' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Customer unavailable';END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW."userId"::text||':service-limits'));
 SELECT plan INTO tier FROM public."Subscription" WHERE "userId"=NEW."userId" AND status='active' AND "periodEnd">now() AND "syncedAt">now()-interval '24 hours';
 IF TG_TABLE_NAME='TelegramMessage' THEN
  SELECT "telegramDaily" INTO cap FROM public."PlanCatalog" WHERE id=COALESCE(tier,'free') AND enabled;
  IF (SELECT count(*) FROM public."TelegramMessage" WHERE "userId"=NEW."userId" AND "createdAt">=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')>=COALESCE(cap,0) THEN RAISE EXCEPTION 'Telegram daily limit reached';END IF;
 ELSE
  IF NEW.mode<>'live' OR NEW.status='disconnected' OR NEW."tokenCiphertext" IS NULL THEN RETURN NEW;END IF;
  SELECT "integrationMax" INTO cap FROM public."PlanCatalog" WHERE id=COALESCE(tier,'free') AND enabled;
  IF (SELECT count(*) FROM public."ApiConnection" WHERE "userId"=NEW."userId" AND id<>NEW.id AND mode='live' AND status<>'disconnected' AND "tokenCiphertext" IS NOT NULL)>=COALESCE(cap,0) THEN RAISE EXCEPTION 'Integration limit reached';END IF;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.pluto_enforce_service_limits() FROM PUBLIC;
CREATE TRIGGER pluto_telegram_limit BEFORE INSERT ON "TelegramMessage" FOR EACH ROW EXECUTE FUNCTION public.pluto_enforce_service_limits();
CREATE TRIGGER pluto_integration_limit BEFORE INSERT OR UPDATE ON "ApiConnection" FOR EACH ROW EXECUTE FUNCTION public.pluto_enforce_service_limits();
CREATE ROLE pluto_erasure NOLOGIN NOSUPERUSER NOBYPASSRLS;
ALTER TABLE "CustomerErasure" ADD COLUMN token uuid;
CREATE FUNCTION public.pluto_claim_erasure() RETURNS TABLE("userId" uuid,token uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 RETURN QUERY WITH due AS(SELECT e."userId" FROM public."CustomerErasure" e JOIN public."User" u ON u.id=e."userId" WHERE u.status='deleted' AND e.attempts<5 AND (e."leaseUntil" IS NULL OR e."leaseUntil"<now()) ORDER BY e."requestedAt" LIMIT 1 FOR UPDATE OF e SKIP LOCKED)
 UPDATE public."CustomerErasure" e SET token=gen_random_uuid(),attempts=attempts+1,"leaseUntil"=now()+interval '10 minutes' FROM due WHERE e."userId"=due."userId" RETURNING e."userId",e.token;
END $$;
CREATE FUNCTION public.pluto_complete_erasure(customer uuid,fence uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 PERFORM 1 FROM public."CustomerErasure" e JOIN public."User" u ON u.id=e."userId" WHERE e."userId"=customer AND e.token=fence AND e."leaseUntil">now() AND u.status='deleted' FOR UPDATE OF e,u;IF NOT FOUND THEN RETURN false;END IF;
 DELETE FROM public."User" WHERE id=customer AND status='deleted';DELETE FROM public."CustomerErasure" WHERE "userId"=customer;RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.pluto_claim_erasure(),public.pluto_complete_erasure(uuid,uuid) FROM PUBLIC,anon,authenticated,pluto_app,pluto_worker;
GRANT USAGE ON SCHEMA public TO pluto_erasure;
GRANT EXECUTE ON FUNCTION public.pluto_claim_erasure(),public.pluto_complete_erasure(uuid,uuid) TO pluto_erasure;
