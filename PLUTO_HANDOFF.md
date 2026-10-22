# Latest home-computer handoff — October 22, 2026

This section supersedes historical status below. Work only on `feature/pluto-saas-v1`; never merge into personal JARVIS/master without explicit owner authorization. Owner is stopping work here and continuing at home.

## Completed and pushed

- Recoverable onboarding, Settings deep links/history, profile transaction regressions, MFA/reset destination handling, safe password/session-revocation failures and explicit paid model/rate requirements are implemented. Vitest was patched to 4.1.12.
- Fixed signed-in Assistant routing to the commercial intelligence workspace. Paid features remain disabled.
- Fixed actionable invitation-denial feedback. This computer's initially empty local beta invitation list blocked the second customer; owner supplied its email, added the Supabase Auth user and then successfully completed onboarding. Invitation exists only in ignored local configuration; do not open public signup.
- Live two-account Notes acceptance: first account created/edited `Pluto acceptance check — synthetic (verified)` (tag synthetic-acceptance); second created `Pluto second-customer acceptance — synthetic` (tag synthetic-isolation). Both persisted through full refresh and repository Reload. Each account saw only its own note, including the first account after signing back in. Leave both synthetic records for remaining acceptance. This proves normal note-list separation, not every direct-record/write/export boundary.
- Final broad verification: 336 unit/database tests across 64 files, eight focused browser tests, ESLint, TypeScript/route generation, production build, three production boundary tests, and a scan of 59 client assets against the configured private DATABASE_URL passed. Subsequent invitation-message change passed 12 focused enrollment/PostgreSQL tests, ESLint and TypeScript. Latest evidence-only commits did not require another build. One unpatched development-only braces advisory remains; production audit previously had zero advisories.

## Exact stopping point: password recovery email delivery

An initial recovery email arrived, but its link opened the Welcome back/sign-in page rather than Choose a new password. Owner confirmed the request began in Codex's browser and the email link opened in Chrome/Edge. PKCE browser mismatch is a likely explanation, not a verified resolution. Owner also confirmed this exact Redirect URL is configured in the separate Pluto Supabase project:

`http://127.0.0.1:3002/auth/callback?next=reset-password`

We instructed a fresh request and link opening in the same Chrome/Edge browser. Owner then reported that new recovery emails were no longer arriving. Suspected Supabase built-in email rate limit (documented two emails/hour/project and default 60 seconds between recovery requests for a user), but NO Auth log error or SMTP configuration was inspected to confirm the cause. The generic /forgot-password?status=sent response intentionally does not reveal delivery/account existence. Do not record recovery as passed. No password update, global sign-out acceptance or live MFA enrollment/recovery has been verified in this session.

Next: inspect the separate project's Auth logs for the latest /recover result without copying tokens, determine rate-limit versus delivery/configuration failure, and check built-in versus custom SMTP. Avoid repeated email requests. When allowed, request ONE fresh recovery link and open it in the SAME browser and origin; owner handles recovery link/password/OTP privately. Verify reset form, password update, old-session revocation, new-password login and subsequent MFA acceptance. Do not reuse the already consumed link. Reliable commercial email requires separately approved custom SMTP configuration; no purchase/provider activation is authorized by this handoff.

References: https://supabase.com/docs/guides/auth/rate-limits and https://supabase.com/docs/guides/auth/sessions/pkce-flow

## Resume safely at home

1. Inspect/preserve home Pluto uncommitted and unpushed work before fetching/pulling. Reconcile divergent Pluto commits; never discard changes or pull this branch into personal master. Read AGENTS.md, the preserved full JARVIS_SPEC.md, IMPLEMENTATION_PLAN.md, this latest handoff, PLUTO_READINESS.md and PLUTO_TEST_RESULTS.md.
2. Install locked dependencies and generate Prisma client if needed. No new migration is required for this session's changes; do not rerun provisioning or migrations to repair login.
3. Update ONLY the home Pluto ignored DATABASE_URL with the owner's newly rotated pluto_runtime password from the owner's secure copy, URL-encoded correctly. Git does not transfer it. Do not ask for passwords in chat or use admin/service-role credentials in the web runtime. Keep connection_limit=1 where suitable; the shared runtime role has a three-connection cap. Stop unused Pluto instances if they occupy the role's capacity; do not terminate unrelated work.
4. Configure the separate project qnfyrnbrrehgdqursitg, its public Auth URL/key and exact PLUTO_SITE_URL matching the chosen home origin. This computer used http://127.0.0.1:3002; localhost is a different origin. Match Auth callback allowlists. Restore only the explicitly approved test-account email(s) in the local PLUTO_BETA_EMAILS as needed. Existing active customers remain usable without invitations; new workspace enrollment requires one. Keep secrets and private email lists outside Git.
5. Keep registration, paid AI/Voice, checkout, workers and connectors disabled. No deployment or public launch approval has been given. Personal JARVIS, its database and configuration remain separate.
6. Continue the recovery investigation above, then live MFA/session-expiry, direct-record/write/export isolation, separate admin acceptance, hosted load/restore, remaining security/tooling/legal/brand/expense gates. Local readiness is not public launch readiness.

Local screenshots were saved outside Git on this computer; home Codex should rely on the committed exact test records and recreate only necessary non-destructive evidence. All application/source/docs work is pushed; ignored credentials intentionally remain local.

---

Historical handoff follows; statements about missing environment or pending sign-in describe earlier stages.

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
