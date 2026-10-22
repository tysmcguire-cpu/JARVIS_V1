-- Permission-only follow-up for Supabase's default per-role function grants.
-- Trigger functions execute as triggers without browser EXECUTE privileges.
-- Do not modify provider-owned functions such as public.rls_auto_enable().
REVOKE ALL ON FUNCTION public.pluto_erase_worker_data() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pluto_enforce_service_limits() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pluto_product_customer() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pluto_admin_separate() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pluto_erase_voice() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pluto_storage_budget() FROM PUBLIC,anon,authenticated;
