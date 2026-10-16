# Database design

Foundation contains User, UserSettings and AuditLog. UUID identity equals Supabase auth.users.id. The reviewed migration adds the auth foreign key, a unique singleton flag with a true-only check, notification time/day/currency checks and RLS. Exactly one application owner row can exist. No public registration or browser inserts into User are allowed.

UserSettings has a cascading owner foreign key, unique owner key, timestamps and initial notification defaults. AuditLog has an owner/time index and contains only action/outcome, with no credential or message payload. Actual sign-in attempts are recorded by Supabase Auth audit logs; application domain audit emission begins with domain mutations. Future audit retention must be decided before deletion features.

## Configure and migrate

1. Create a Supabase development project. Disable new user signups and anonymous sign-in. Create the owner manually in Auth with a strong password; copy its UUID into JARVIS_OWNER_ID.
2. Copy the database URLs from Supabase Connect into .env. Use a pooled runtime URL with `pgbouncer=true` for transaction pooling and direct/session connection for DIRECT_URL. Require SSL remotely. URL-encode password characters. Do not commit either URL.
3. Run `pnpm db:generate`, `pnpm db:validate`, `pnpm db:migrate`. Migration requires Supabase's auth schema; it will not work unchanged on generic PostgreSQL.
4. Run `pnpm db:provision` explicitly. The command verifies the configured Auth identity, refuses to replace another/synthetic owner, and creates the owner/settings records without overwriting existing preferences. It creates jarvis_app with a cryptographically generated password, SELECT on the three application tables, no superuser/role creation/database creation/RLS bypass, and owner-scoped SELECT policies. Its password is saved only to the ignored .env DATABASE_URL; DIRECT_URL remains the separate administrative connection. The command will not reset an existing role with unknown credentials.
5. Run `pnpm db:verify`. It checks the live migration, persisted owner/settings and defaults, runtime role restrictions, owner/second-user/unscoped RLS, transaction identity isolation, write denial and denial of access to auth.users. It changes no user records. Errors suppress private details.

The app does not need a Supabase service-role API key. Prisma uses its database connection only on the server. Phase 1 runtime access is SELECT-only; later phases must explicitly grant narrowly scoped writes and add matching RLS policies when implementing internal data entry. Role/policy provisioning is explicit environment setup rather than a schema migration requiring deployment-specific database roles. Browser roles have SELECT-only access under RLS. Never use migration administrator credentials as the running app's DATABASE_URL. Do not supply DIRECT_URL to a deployed request runtime; keep it in a separate migration environment.

The synthetic UI needs no database. Optional development seed requires JARVIS_SEED_SYNTHETIC=true and JARVIS_DATABASE_ENV=development, refuses production and existing real owner rows, and still requires a real development Auth owner UUID. It only seeds a clearly labeled synthetic owner/settings. Never seed production.

## Planned normalized domains

Phase 2: FinancialAccount → Transaction → Category; Budget → BudgetCategory; RecurringExpense. All money uses BigInt minor units and ISO currency; no floating-point arithmetic. Course → Assignment, Exam, Grade and StudySession. Event, Task and Reminder; CareerApplication → Contact/FollowUp; Project → Milestone/ProjectActivity; Goal → Habit → HabitEntry; Note. Every entity has UUID, owner UUID, timestamps, appropriate status/date indexes and FK constraints. Cross-entity ownership must be enforced using compound owner keys/FKs, not just independent IDs.

Phase 3: TelegramIdentity and TelegramMessage with approved unique chat/user bindings and unique update ID for deduplication. Phase 4: ApiConnection (encrypted token material), SyncLog and external ID/connection uniqueness. Phase 5: AiConversation, AiMessage and SourceReference with provenance and freshness. Phase 6: NotificationRule, Job and Delivery with unique idempotency keys, status, attempts and scheduled/run timestamps.

No speculative domain tables are migrated before their validation rules are implemented. Later migrations must include RLS, constraints, indexes, owner isolation and synthetic seeds. Backup, export, restore and deletion workflows remain Phase 6 gates.

## Phase 2 deployed storage

The 20261016000000_core_tracking migration adds the 24 models listed in `entities.json`, their owner/parent foreign keys, field checks, unique budget/category and habit/day pairs, indexes and forced RLS. Run `pnpm db:tracking` after migrations to grant narrow domain CRUD and audit INSERT to the existing jarvis_app role; inherited machine logins obtain the same permissions. It changes no passwords and grants no writes to User or UserSettings. Do not rerun original provisioning with unknown jarvis_app credentials.

`pnpm db:verify` still checks Foundation identity/settings and their write denial, accepting runtime roles that are members of jarvis_app. `pnpm db:verify-tracking` checks each domain's owner CRUD and audit INSERT in a rolled-back transaction, plus unscoped/second-identity isolation. No sample records persist. `pnpm db:seed` now seeds all domain types, but remains guarded against production and any existing real owner; it is unnecessary for the real project or browser demo.
