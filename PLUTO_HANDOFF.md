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
