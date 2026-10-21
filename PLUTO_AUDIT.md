# Pluto baseline audit

Starting commit: 7dd529712d5e1745358898a3106a693c929f996a (master). Commercial branch: feature/pluto-saas-v1. Personal checkout was clean; no uncommitted changes existed to preserve. Separate commercial checkout: ../PLUTO_V1. No .env copied, no live DB queried, no deployment/bot modified. Source inspections are evidence of code presence, not production verification.

## Evidence inventory

| Area | Baseline evidence | Verified status / commercial changes |
| --- | --- | --- |
| Tracking | src/features/tracking/repository.ts, finance-operations.ts, entities.json; composite owner FKs and RLS in core_tracking migration | Reusable exact BigInt money, transactional transfers, budgets, calendar, education, career, projects, goals, notes. Personal baseline reports 226 tests; commercial tests must rerun. |
| Identity | src/features/auth/server.ts, actions.ts, policy.ts, src/lib/env.ts, src/proxy.ts | Single UUID gate via JARVIS_OWNER_ID; no public registration/recovery. Must replace with verified per-customer identity, verified email and active app account. |
| Schema | prisma/schema.prisma User.singleton; foundation migration User_singleton_true and unique index | Existing tenant IDs and ownership FKs reusable. Singleton must be removed in an additive commercial migration, never on personal DB. |
| DB boundary | src/lib/owner-db.ts | Transaction-local auth.uid() is reusable and prevents pooled identity leakage. Each repository authenticates independently. Runtime role provisioning scripts currently select one owner. |
| RLS | historical migrations; security migration FORCE RLS, revoked browser grants | Most record policies already compare auth.uid() with userId. Foundation runtime grants depend on external provisioning. Commercial role bootstrap and multi-identity tests required. |
| Branding | src/app/layout.tsx; shell/shell.tsx; wordmark.tsx; assistant/provider.ts; Telegram commands | JARVIS throughout strings and SVG paths. Replace visible text AND graphical wordmarks; centralize Pluto identity. Historical docs/migrations require explicit compatibility treatment. |
| Assistant | assistant/provider.ts, analysis.ts, repository.ts, storage.ts | Bounded deterministic grounding + opt-in OpenAI interpretation/composition. Not multi-turn chat, subscription metering, weekly generated reports, voice or web research. |
| Telegram | telegram/config.ts, actions.ts, service.ts | Single env user/chat/owner, hashed expiring code, idempotent updates, leased replies and quick-money commands reusable. Commercial routing/pairing must resolve tenants through DB, not a global UUID. |
| Notifications | notifications/engine.ts, worker.ts, repository.ts | Durable per-user jobs, lease tokens, retries/deduplication reusable. Tick dispatches one env owner; multi-customer discovery/dispatch missing. |
| Connectors | integrations/repository.ts, encryption.ts, http-providers.ts, canvas-feed-worker.ts | Tenant-associated AES-GCM credentials with AAD and bounded read-only adapters. Must use a new commercial encryption key and OAuth credentials; worker still single owner. No personal tokens copied. |
| Account lifecycle | data-controls/repository.ts, snapshot.ts, backup.ts | Scoped export, guarded deletion, authenticated backup formats exist. Auth account deletion, subscription cancellation/revocation orchestration and commercial retention missing. |
| UI | dashboard, module workspaces, appearance settings | Desktop command center and direct widget resizing implemented; desktop-size blocker and fixed layouts must become responsive. |
| Billing/admin | no Stripe client/webhook/entitlement/admin metrics files at baseline | Missing. Must build server-authoritative event processing, concurrency reservations and distinct MFA-protected admin capability. |
| Hosting | scripts/hosted-start.ts, hosted-worker.ts | Existing always-on web+child supervision reusable. Never point commercial process at personal environment; worker scheduling must be tenant-aware before activation. |

## Retired / constrained features
Plaid live banking is retired by owner request: do not reactivate it. Gmail and Drive are hidden by owner request. Google/Apple calendar remain optional read-only; Canvas feed does not provide grades or completion state. Existing AI recommendations are consent-based; no proactive model jobs by default.

## Risks and gates
1. Replacing only the login gate would leave single-owner workers/bots and singleton provisioning unsafe.
2. Runtime role must not be table owner, BYPASSRLS, superuser or a service-key replacement; browser roles remain denied.
3. Personal migrations contain jarvis_app compatibility grants; never edit historical SQL checksums or run commercial migrations on the original database.
4. Admin analytics must expose aggregate operational data only. Admin membership must be explicit and require MFA, not first-signup/email matching.
5. All paid providers remain disabled until configuration AND explicit activation. Atomic reservations and durable job idempotency are mandatory.
6. Existing docs include historical claims that are not commercial acceptance. New result logs distinguish mocked/local tests from real Supabase/Stripe/hosted acceptance.
7. Account deletion must not permit silent account recreation or leave active billing/credentials behind.
8. Trademark clearance, independent security review, external provider acceptance and real production tests remain pre-launch gates.

## Audit coverage
Read README, master specification, implementation/security/architecture/database/deployment/recovery and assistant docs; inspected schema/migrations, auth/proxy/runtime DB, tracking/data actions, AI provider/storage, Telegram config/pairing/service, notification scheduler/worker, connector encryption/adapters, export/deletion, branding/shell/dashboard and hosted startup. Baseline source scan found 329 owner/singleton-related matches across 59 files. No personal data was opened.
