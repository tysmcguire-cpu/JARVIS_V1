# Database design

Notification frequency extension: `20261017000000_notification_frequency` adds strict-object JSON config to NotificationRule, allows the independent reminder kind, and indexes NotificationJob owner/entity/source lookups. Server schemas allow only bounded cadence/channel/source choices. Existing preferences remain defaults. Export includes the config; restore validates it and supplies legacy defaults for older backups without that column.

Phase 6 adds NotificationRule, NotificationJob and NotificationDelivery with forced RLS, owner-bound references, deduplication, version invalidation and delivery-attempt uniqueness. The security migration also forces foundation-table RLS and revokes browser-role access to User/UserSettings/AuditLog, closing a Data API bypass of application MFA. Restricted runtime grants were applied; `pnpm db:verify-release` passed live with verification changes rolled back. Export/restore covers all 39 application tables; Supabase Auth and environmental secrets are excluded. See RECOVERY.md.

Phase 5 adds AiConversation/AiSourceReference with owner-bound compound foreign keys, RLS and browser-role revocation. Deleting a conversation cascades its sources. Audit request events enforce the website hourly guard after history deletion. Runtime has narrow CRUD grants; `db:verify-assistant` rolls back its verification fixtures.

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

## Phase 3 Telegram state

TelegramIdentity stores the approved owner/bot/chat tuple, hashed expiring pairing challenge and paired timestamp. TelegramMessage stores bounded replies, unique per-owner/bot/update receipt, undo target/version and reply retry/lease/cancellation state. Incoming text and bot tokens are not stored. Forced owner RLS and owner foreign keys apply. `pnpm db:telegram` grants only the required state-table CRUD; audit INSERT remains prefix/owner restricted. Live state verification rolls back its synthetic CRUD and does not call Telegram. See TELEGRAM.md before activating the bot.

## Phase 4 integration storage

The migration adds ApiConnection, SyncLog, ExternalRecord, CsvImportBatch and CsvImportKey plus optional transaction provenance. Compound owner links, uniqueness, hash/count/credential checks, indexes and forced RLS apply. Browser roles have no direct table access. Runtime setup is pnpm db:integrations; pnpm db:verify-integrations checks live CRUD, linking, cascades and isolation with a rolled-back transaction, without retaining fixtures or contacting providers.

CSV retention/provenance and key backup are described in INTEGRATIONS_PHASE4.md. Currency/category updates lock parent rows so a concurrent import cannot invalidate its reviewed classification. Owner transactions have a bounded 15-second timeout for this workflow.

## Optional Apple Calendar provider

Migration 20261017010000_apple_calendar extends the ApiConnection provider constraint to apple-calendar while retaining legacy provider identifiers. It is applied to the existing database. Apple credentials (email and app-specific password) use the existing encrypted credential envelope; selected private calendar collection URLs remain owner-scoped connection configuration. No new table, runtime grant or paid service is required. Synthetic Apple connection insertion and cross-owner denial were verified in a rolled-back transaction. No real calendar account was contacted. See CALENDAR_CONNECTIONS.md for read-only snapshot and credential limits.

Canvas feed storage reuses the existing canvas ApiConnection provider. The private feed URL resides only inside the encrypted credential envelope; selection stores canvasTransport=feed, the calendar-feed resource identifier and an explicit 0/15/60/360-minute refresh preference. ExternalRecord holds bounded read-only event/assignment snapshots. No migration or new runtime grant is required. Synthetic scheduled sync/storage/reconciliation and notification owner queries were exercised against PostgreSQL-compatible test storage. No live owner calendar data was read or changed.

Canvas education/calendar display uses owner-scoped read projections over existing ExternalRecord/ApiConnection snapshots in the same batched tracking query. No migration, copied Course/Assignment/Event rows or new grant is required. Projected course identifiers are deterministic source-view identifiers, not physical manual foreign keys; manual linked choices still select real owner Course rows only. Read-only source rows cannot be updated/deleted through manual table actions. Integration source deletion/disconnection propagates to the view automatically. Source timestamps are retained and dates rendered in UserSettings.timezone. This also avoids introducing another notification entity for the same imported assignment.

## Chase bank transaction history (2026-10-17)

Read-only Chase/Plaid Transactions connection, encrypted owner-bound grant and OAuth session, periodic hosted-worker sync, atomic cursor reconciliation, pending-to-posted replacement, and paginated Finances bank history are implemented. Production is disabled without explicit free Trial confirmation and owner credentials/consent. No live bank connection has been tested. Existing manual ledger and alerts do not automatically include bank records. Additive bank-history migration extends existing provider/kind constraints and indexes; no new database role or paid worker is required. Revoke the bank Item before app-data deletion or snapshot replacement; backups exclude credentials and restores disconnect providers. See [CHASE_BANK_SETUP.md](CHASE_BANK_SETUP.md) for activation, free Trial limits and recovery details.

Appearance settings (20261019000000_appearance) add primaryColor and secondaryColor to UserSettings with six-digit hex constraints and existing cyan/violet defaults. Existing owner update authorization applies; an exact-action audit INSERT policy permits settings.appearance.update. Existing snapshots without palette fields restore with default colors.

Migration 20261020000000_background adds UserSettings.background with the existing appearance as the default ('current') and a database constraint accepting only current/black/white. Existing owner-scoped settings updates and exact-action appearance audit policies apply. Older backups restore 'current' if the field is absent; older demo palette cookies also default to 'current'.
