# Pluto handoff — October 22, 2026

Branch: `feature/pluto-saas-v1`. Personal JARVIS/master must never receive these changes without explicit owner authorization.

## Acceptance evidence

The owner reports remembering successful onboarding and customer-account testing on the other computer. The detailed results may remain unpushed there. This is owner-reported acceptance, not a live test executed on this computer. Do not recreate accounts, reset credentials, rerun migrations or enable registration merely to reconstruct that evidence.

Latest previously committed database evidence: all 28 migrations applied to the separate Pluto project, including the AuditLog INSERT RETURNING policy fix. This computer has no Pluto private environment and did not contact Supabase or activate providers.

The new `pluto-onboarding-database.test.ts` runs the production onboarding action and customer database boundary against ephemeral PostgreSQL with all committed migrations and the restricted pluto_app role. Supabase session identity is mocked; the SQL, RLS and transactions are real. The Prisma adapter deliberately uses INSERT RETURNING for audit creation. This does not establish real email/session/MFA or hosted acceptance.

Coverage: failed audit rolls back profile/settings; retry succeeds; two independent customers retain their own settings/audits; browser-supplied IDs cannot choose the account; repeated onboarding preserves saved preferences; removed invitations do not lock out active customers; uninvited profiles are rejected; suspension blocks onboarding and customer queries while the second customer remains usable.

## On the home computer

1. Inspect `git status` and preserve all uncommitted/unpushed work before pulling. Do not reset or discard it. Inspect local commits against origin/feature/pluto-saas-v1 and reconcile any divergent changes on the Pluto branch only.
2. Recover the prior live acceptance notes: which two accounts were tested (use aliases, no credentials), onboarding/persistence, cross-account reads/writes/references/export and any deletion checks. Record pass/fail and omissions. Owner recollection does not imply every lifecycle scenario was exercised.
3. Confirm the latest onboarding fix is present and compare local evidence with PLUTO_SETUP_STATUS.md. Avoid repeating destructive deletion tests on valuable customer workspaces.
4. Continue remaining Auth recovery/email/MFA and hosted acceptance only where not already verified. Separate commercial hosting, Stripe, Telegram, AI and other provider activation retain their existing approval/configuration gates.

Production source and schema are unchanged in this handoff; this change adds executable regression coverage and clarifies verification status. See PLUTO_TEST_RESULTS.md for checks executed on this computer.

Executed checks on October 22: focused 12/12 tests, full 317/317 tests (61 files), full ESLint, TypeScript/Next route generation and git diff --check passed. Prisma client generation was needed after the fresh dependency install. Browser/production-build checks were not rerun for this test/documentation-only change.

## Recoverable onboarding — October 22, 2026

Onboarding now keeps customer choices in the wizard when workspace creation fails and offers a retry with a generic error message. Server-side authentication runs outside the recoverable transaction boundary, so login/MFA redirects still work. Successful completion redirects only after the transaction commits. Name/timezone validation happens before the next step; Enter advances intermediate steps without creating a workspace, and pending submission disables Back/Create controls. No schema, provider or account configuration changes are required.

The browser regression renders the production form with a synthetic action in an isolated page: no authenticated test route, session bypass or real customer creation is introduced. Separate PostgreSQL and action tests cover transaction/authorization behavior. This supplements the earlier handoff; production source does change in this follow-up. Live owner-reported acceptance remains separate from locally executed checks.

Final verification for this follow-up: 320 unit/database tests, full ESLint, TypeScript, final production build, three production boundary tests and four relevant browser scenarios passed across the initial run plus corrected rerun. Personal JARVIS remains separate; no live credentials or services were used.

## Continue here before home-computer reconciliation

The owner authorized continued Pluto development on this computer until the next external input gate. New Settings deep links, onboarding plan review, profile transaction regressions, MFA/password-reset continuation, truthful session-revocation retry and explicit paid-provider model/rate configuration are included in the readiness follow-up. See PLUTO_READINESS.md for the minimal separate runtime environment needed next. No personal resource, migration, deployment or provider activation changed. Home-computer Codex should preserve/reconcile its local work, then pull the Pluto branch and read the newest readiness/test records.

## Live runtime connection accepted on this computer

The owner reset only pluto_runtime's password through the separate Pluto project's SQL Editor and saved new runtime credentials in this checkout's ignored .env.local. After the owner closed an idle pluto_runtime session that occupied the three-connection role cap, an executed READ ONLY transaction authenticated successfully, confirmed current_user=pluto_runtime, rolsuper=false, rolbypassrls=false, the pinned qnfyrnbrrehgdqursitg installation and zero visible unscoped User rows. No customer UUID/content was printed and no database records, grants or role limits were changed by the verification. This local URL now uses connection_limit=1 to avoid monopolizing the shared development role. The local app starts on loopback port 3002. Actual customer login/recovery/MFA/browser acceptance is still pending and requires the owner to sign in privately.

The home computer must replace the password in its ignored Pluto DATABASE_URL using the owner's secure saved copy, then restart Pluto. Pulling Git does not transfer .env.local or credentials. Do not recreate the role, rerun migrations, reset another password or use personal JARVIS configuration. Existing home-computer pooled sessions may have survived rotation, but new connections need the new credential.
