-- All application data goes through independently verified server repositories.
-- Supabase Auth still works; browser Data API roles cannot bypass application MFA.
REVOKE ALL ON "User","UserSettings","AuditLog" FROM anon,authenticated;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
