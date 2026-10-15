# Database design

Foundation contains User, UserSettings and AuditLog. UUID identity equals Supabase auth.users.id. The reviewed migration adds the auth foreign key, a unique singleton flag with a true-only check, notification time/day/currency checks and RLS. Exactly one application owner row can exist. No public registration or browser inserts into User are allowed.

UserSettings has a cascading owner foreign key, unique owner key, timestamps and initial notification defaults. AuditLog has an owner/time index and contains only action/outcome, with no credential or message payload. Actual sign-in attempts are recorded by Supabase Auth audit logs; application domain audit emission begins with domain mutations. Future audit retention must be decided before deletion features.

## Configure and migrate

1. Create a Supabase development project. Disable new user signups and anonymous sign-in. Create the owner manually in Auth with a strong password; copy its UUID into JARVIS_OWNER_ID.
2. Copy the database URLs from Supabase Connect into .env. Use a pooled runtime URL with `pgbouncer=true` for transaction pooling and direct/session connection for DIRECT_URL. Require SSL remotely. URL-encode password characters. Do not commit either URL.
3. Run `pnpm db:generate`, `pnpm db:validate`, `pnpm db:migrate`. Migration requires Supabase's auth schema; it will not work unchanged on generic PostgreSQL.
4. Provision the owner using the SQL below in Supabase SQL Editor, replacing the explicitly marked UUID. This is a manual operation; no application superuser endpoint exists.

```sql
begin;
insert into public."User" (id, "updatedAt")
values ('<APPROVED_AUTH_USER_UUID>'::uuid, now());
insert into public."UserSettings" ("userId", "updatedAt")
values ('<APPROVED_AUTH_USER_UUID>'::uuid, now());
commit;
```

The app does not need a Supabase service-role API key. Prisma uses its database connection only on the server. Provision a least-privilege runtime role with SELECT/INSERT/UPDATE/DELETE on application tables only, never schema creation or auth table access. A privileged role may bypass RLS: server-side owner checks and scoped queries remain mandatory. Browser roles have SELECT-only access, further restricted by RLS. Database migrations must use a separate privileged connection. Configure roles in Supabase before production.

The synthetic UI needs no database. Optional development seed requires JARVIS_SEED_SYNTHETIC=true and JARVIS_DATABASE_ENV=development, refuses production and existing real owner rows, and still requires a real development Auth owner UUID. It only seeds a clearly labeled synthetic owner/settings. Never seed production.

## Planned normalized domains

Phase 2: FinancialAccount → Transaction → Category; Budget → BudgetCategory; RecurringExpense. All money uses BigInt minor units and ISO currency; no floating-point arithmetic. Course → Assignment, Exam, Grade and StudySession. Event, Task and Reminder; CareerApplication → Contact/FollowUp; Project → Milestone/ProjectActivity; Goal → Habit → HabitEntry; Note. Every entity has UUID, owner UUID, timestamps, appropriate status/date indexes and FK constraints. Cross-entity ownership must be enforced using compound owner keys/FKs, not just independent IDs.

Phase 3: TelegramIdentity and TelegramMessage with approved unique chat/user bindings and unique update ID for deduplication. Phase 4: ApiConnection (encrypted token material), SyncLog and external ID/connection uniqueness. Phase 5: AiConversation, AiMessage and SourceReference with provenance and freshness. Phase 6: NotificationRule, Job and Delivery with unique idempotency keys, status, attempts and scheduled/run timestamps.

No speculative domain tables are migrated before their validation rules are implemented. Later migrations must include RLS, constraints, indexes, owner isolation and synthetic seeds. Backup, export, restore and deletion workflows remain Phase 6 gates.
