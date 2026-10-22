# Pluto setup status — database and permission cleanup verified

Commercial project: **qnfyrnbrrehgdqursitg**. Branch: **feature/pluto-saas-v1**.

## Completed with owner approval

- All original **26 migrations** applied successfully; live migration history shows 26 completed entries.
- Installation marker matches the separate Pluto project.
- Created exactly one new LOGIN role: **pluto_runtime**, inheriting only **pluto_app**. No auxiliary LOGIN roles were created and no existing passwords were changed.
- Runtime login has no superuser, role/database creation, replication or RLS-bypass attributes. It cannot create public-schema objects, change subscriptions/installation metadata or read administrator membership. A direct attempted admin-table SELECT was denied.
- Live metadata confirms **59 customer-owned tables** have ENABLE + FORCE RLS; browser roles have no application-table privileges. Customer queries without an identity return no rows. Two real Auth customers and write isolation still require acceptance; empty-table reads alone do not prove that acceptance.
- Connection credentials are saved privately outside Git at `C:\Users\tysmc\Documents\Codex\2026-10-15\pu\work\pluto-private\.env.runtime`. Windows ACLs restrict this folder to the current user, SYSTEM and Administrators.
- Maintained local Pluto checkout has a Git-ignored, similarly ACL-restricted `.env.local` using the restricted DATABASE_URL and public Auth configuration. It excludes DIRECT_URL and approval flags. Working checkout: `C:\Users\tysmc\Documents\Codex\2026-10-15\pu\PLUTO_V1`.
- Original ZIP-folder `.env` remains the migration-only credential source; do not upload it to Render or commit it. Its existing values have not been overwritten. No personal JARVIS resources were changed.

## Local compatibility fixes verified

The first migration-launch attempt failed locally before connecting because top-level await was incompatible with the actual Node/tsx module format. The launcher now uses an async entrypoint; an execution regression test verifies fail-closed behavior before network access when unapproved.

The first role attempt rolled back before creating a login: Prisma could not deserialize PostgreSQL void results. Installation/request/activity/maintenance calls now cast results to text. Live read-only validation confirms the cast works; local regression checks the production helper's actual PostgreSQL result type. A transient initial connection timeout resolved on a subsequent read-only connection check; no credentials were rotated.

Local unit/database tests and production build checks are recorded in PLUTO_TEST_RESULTS.md. Client asset scan verified the actual restricted DATABASE_URL was absent from all 59 assets; no credential values were printed.

## Applied with separate owner approval: migration 27

Live Supabase metadata revealed explicit default browser EXECUTE grants on six Pluto **trigger** functions. PostgreSQL trigger functions cannot be invoked as ordinary functions; no browser table access or customer-data exposure was found in these checks. Nevertheless these unnecessary grants should be removed to match the intended boundary.

Approved and applied permission-only migration:
`20261022080000_pluto_trigger_acl`

It revokes PUBLIC/anon/authenticated execution on exactly:
- pluto_erase_worker_data()
- pluto_enforce_service_limits()
- pluto_product_customer()
- pluto_admin_separate()
- pluto_erase_voice()
- pluto_storage_budget()

It does not change function bodies, records, passwords, table grants or RLS policies. It leaves the provider-owned rls_auto_enable() function untouched. The reviewed local manifest and live migration history now both contain 27 completed migrations. Read-only verification confirms the six Pluto browser EXECUTE grants are removed; the Supabase-managed event-trigger function remains unchanged. Tests now simulate Supabase's explicit default function grants.

**Exact next owner action: provide the email address to allow for the first private Pluto test account. Do not send a password.** The permission cleanup received separate owner approval and is complete. Registration remains disabled until private account setup is explicitly configured; no Auth user has been created.

## Still disabled / not authorized

Signup, checkout, workers, Telegram, integrations and paid AI/voice/research remain disabled. No deployment, purchase, personal-JARVIS change, real Auth-user creation or provider activation has occurred. Email/recovery/MFA, two-customer acceptance and hosted recovery/load remain pending.