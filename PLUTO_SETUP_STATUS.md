# Pluto setup — prepared locally, awaiting database connection

Target: **qnfyrnbrrehgdqursitg**. Branch: **feature/pluto-saas-v1**. No cloud changes, migrations, role creation, deployment, purchases or provider activation have been performed.

## Verified locally

The supplied ZIP folder's `.env` exists. Its project reference and Auth URL match the target; its publishable-key format is valid. No personal owner variable or enabled consequential feature/approval flags were found. Neither DATABASE_URL nor DIRECT_URL is configured. These are offline checks, not authentication or connectivity tests. Existing Auth dashboard settings have not been independently inspected.

The ZIP folder has no `.git`. Development stays in the maintained PLUTO_V1 branch checkout. No credentials were copied from the ZIP, printed or committed. Its `.env` was not edited.

## Prepared automation

- `corepack pnpm setup:preflight --env=PATH`: offline project/key/URL/flag checks and reviewed migration inventory verification; never connects.
- `corepack pnpm setup:inspect --env=PATH`: default offline inspection plan. After the URI is saved, `--connect` authenticates using a READ ONLY transaction and checks Auth prerequisites/destination safety; never migrates or provisions.
- `corepack pnpm setup:roles --env=PATH`: default offline SQL plan for one app login; no connection. Optional `--role=worker|billing|erasure|admin|adminApi` plans are separate.
- Role execution requires **both** `--apply` and `PLUTO_ALLOW_ROLE_PROVISIONING=approved`, a reviewed project/installation and private `--credentials-file=PATH` outside Git. It generates a new random password, refuses an existing login instead of changing credentials, grants one fixed group, checks inherited privilege/schema-CREATE hazards, and writes the connection URL privately. Do not run it before explicit approval.
- Migration execution still requires `PLUTO_ALLOW_MIGRATIONS=approved` and DIRECT_URL. It now checks the exact project pin and all 26 reviewed migration hashes, then inspects the destination **before any DDL**. Unmarked databases with public tables/views or existing Pluto roles are refused; existing installations must match. A partially applied/unmarked migration needs recovery review, not blind retry. Admin URL is supplied only to the migration child, never web requests. Raw migration output is suppressed.
- `deployment/render.pluto.yaml` describes only one new Pluto web service on this branch, with auto-deploy OFF, no database/worker creation, no admin URL, and all consequential capabilities OFF. Importing it would create a paid resource and is **not authorized or performed**. Disable Blueprint Auto Sync separately when approving creation. `/login` is a web liveness check, not database health acceptance.

Use Node 24 and pinned **corepack pnpm 11.25.0**. Existing bare pnpm on the agent host resolves to 11.19.0, so final setup checks use corepack explicitly. Prisma remains 6.19.3.

## Exact next owner action

1. Open the **Pluto project only**: https://supabase.com/dashboard/project/qnfyrnbrrehgdqursitg
2. Click **Connect**, select **Session pooler** (port **5432**, not Transaction pooler 6543). This avoids buying an IPv4 add-on. Copy that project's administrative PostgreSQL URI; use its exact provided pooler hostname and username.
3. Replace the password placeholder privately with this new project's database password, percent-encoding reserved password characters. Add `sslmode=require` using `?` or `&` as appropriate.
4. Save it locally as `DIRECT_URL` in your Pluto `.env`, or in a separate private migration environment file outside Git. Keep all existing values unchanged and all approval flags false. Do not paste the URI/password into chat. Avoid cloud-synchronizing administrative secrets; review OneDrive backup/sync and local file permissions when choosing a private storage location.
5. Reply **“DIRECT_URL saved”** (and the file path only if you chose another file). I can then validate the URL shape privately and prepare the exact read-only connection check. **Saving a credential is not authorization to migrate.** I will request explicit authorization before migration/role creation or any consequential cloud change.

Do not set DATABASE_URL to the postgres administrator URI. The separate `pluto_runtime` connection is generated only after approved migrations and role provisioning. Initial tracking needs only this app login; all five auxiliary logins and paid services can wait.

## Approval sequence after credentials

First authenticate/read-only inspect the pinned destination and confirm schema/roles are empty or already correctly marked. Then obtain explicit approval for the reviewed 26-migration chain on this project only. After successful schema installation, obtain approval for the app login only and write its password privately. Test two real customers, verified-email/recovery and RLS before approving a separate Render deployment. Keep signup, checkout, workers and providers off until their individual acceptance steps pass.

A private credential file can remain after a failed/uncertain provisioning commit; keep it for reconciliation. Never delete the only copy of a potentially committed password or automatically rotate an existing login. Unix file mode is requested by tooling; on Windows, verify inherited ACLs and avoid shared/cloud folders. No private keys are included in deliverables.

## Migration review and remaining acceptance

`deployment/pluto-migrations.reviewed.json` records normalized SHA-256 and size for every migration in execution order. Historical migrations are unchanged. Local SQL tests apply all 26 to embedded PostgreSQL, then verify every customer-owned table forces RLS, browser roles have no application-table privileges, all public definer functions fix search_path and deny browser execution, and the six planned logins have bounded connections/no ownership/no elevated attributes. Existing cross-customer and lifecycle tests continue to apply.

This does not prove hosted Supabase grants/permissions, network reachability, database emptiness, SMTP/email delivery, MFA, live Stripe/bot/provider behavior or hosted restore/load. Those remain external acceptance. No paid plan is required merely to supply a connection URI; do not upgrade or buy IPv4/other services for this step.

Primary references: https://supabase.com/docs/guides/database/connecting-to-postgres ; https://supabase.com/docs/guides/database/postgres/roles ; https://render.com/docs/blueprint-spec ; https://render.com/docs/infrastructure-as-code
