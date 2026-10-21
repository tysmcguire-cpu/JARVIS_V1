# Pluto architecture

Commercial branch feature/pluto-saas-v1 starts at 7dd529712d5e1745358898a3106a693c929f996a. Personal checkout, deployment, database and bot are separate and untouched.

## Implemented customer foundation
Verified Supabase getUser identity and confirmed email are required. MFA-enrolled customers must present matching AAL2 claims. Authentication is independently enforced by every repository/action; the proxy is a preflight only. withCustomerDatabase creates a transaction-local auth.uid(), checks the customer profile is active, and then executes the existing bounded repositories. A missing profile redirects to onboarding. Onboarding derives identity from the verified session, uses RLS-constrained inserts and an advisory lock, and never accepts a browser-provided customer UUID.

Historical per-record userId columns, composite owner FKs, exact finance math and FORCE RLS are reused. Commercial migration removes singleton restrictions only from an empty database. Old personal setup scripts are retired. Runtime connection configuration pins the commercial Supabase project and restricted pluto_runtime login. Personal JARVIS_OWNER_ID is explicitly rejected as a safety compatibility reference.

## Deliberately staged
Billing/usage, conversational intelligence, tenant-aware bot/worker dispatch, aggregate administration, responsive layouts and commercial account deletion are subsequent roadmap phases. Paid flags and public registration default OFF. Existing provider code is not evidence of a commercial feature acceptance. No personal records or credentials are copied.

## Release and operating boundaries
Public startup and live checkout require explicit branding/legal/security/recovery/expense attestations. Closed-beta signup is server-allowlisted (maximum 100 emails); all signup/paid gates remain OFF by default. Separate installation identity, bounded Prisma pools, fixed maintenance and storage/request budgets add operational containment. See PLUTO_DEPLOYMENT.md and PLUTO_COST_MODEL.md. Local implementation does not imply remote provisioning or launch acceptance.
