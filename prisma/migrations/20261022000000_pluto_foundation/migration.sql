-- Commercial-only additive conversion. Refuse a populated personal database.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM "User") THEN
  RAISE EXCEPTION 'Pluto conversion requires an empty, separate commercial database. Personal data is never migrated.';
 END IF;
END $$;
ALTER TABLE "User" DROP CONSTRAINT "User_singleton_true";
DROP INDEX "User_singleton_key";
ALTER TABLE "User" DROP COLUMN singleton;
ALTER TABLE "User" ALTER COLUMN "displayName" SET DEFAULT 'Customer';
ALTER TABLE "User" ADD COLUMN status varchar(20) NOT NULL DEFAULT 'active' CHECK(status IN('active','suspended','deleted'));
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" timestamptz;
ALTER TABLE "UserSettings" ALTER COLUMN "weeklyReviewEnabled" SET DEFAULT false;
CREATE TABLE "PlutoInstallation"(id boolean PRIMARY KEY DEFAULT true CHECK(id),"projectRef" text NOT NULL UNIQUE);
REVOKE ALL ON "PlutoInstallation" FROM PUBLIC,anon,authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='pluto_app') THEN CREATE ROLE pluto_app NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;END $$;
GRANT USAGE ON SCHEMA public,auth TO pluto_app;
GRANT EXECUTE ON FUNCTION auth.uid() TO pluto_app;
GRANT SELECT ON "User" TO pluto_app;
GRANT INSERT(id,"displayName","updatedAt") ON "User" TO pluto_app;
GRANT UPDATE("displayName","onboardingCompletedAt","updatedAt") ON "User" TO pluto_app;
GRANT SELECT,INSERT,UPDATE ON "UserSettings" TO pluto_app;
GRANT SELECT,INSERT ON "AuditLog" TO pluto_app;
CREATE POLICY customer_self_read ON "User" FOR SELECT TO pluto_app USING(id=(SELECT auth.uid()));
CREATE POLICY customer_self_insert ON "User" FOR INSERT TO pluto_app WITH CHECK(id=(SELECT auth.uid()));
CREATE POLICY customer_self_update ON "User" FOR UPDATE TO pluto_app USING(id=(SELECT auth.uid()) AND status='active') WITH CHECK(id=(SELECT auth.uid()) AND status='active');
CREATE POLICY customer_settings_insert ON "UserSettings" FOR INSERT TO pluto_app WITH CHECK("userId"=(SELECT auth.uid()));
CREATE POLICY customer_settings_read ON "UserSettings" FOR SELECT TO pluto_app USING("userId"=(SELECT auth.uid()));
CREATE POLICY customer_audit ON "AuditLog" FOR INSERT TO pluto_app WITH CHECK("userId"=(SELECT auth.uid()) AND action LIKE 'customer.%' AND outcome='success');
DO $$ DECLARE tab text;BEGIN
 FOR tab IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN('User','UserSettings','AuditLog','PlutoInstallation','_prisma_migrations') LOOP
  -- The inherited application tables already have FORCE RLS and per-user policies.
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE %I TO pluto_app',tab);
 END LOOP;
END $$;
