# Pluto migration review and execution boundary

Target project: qnfyrnbrrehgdqursitg. All 26 migrations are reviewed as one ordered fresh-install chain; NONE have been run remotely. Historical migration SQL is unchanged. The normalized full SHA-256 manifest is deployment/pluto-migrations.reviewed.json; any changed migration causes the execution wrapper to refuse until reviewed again.

Historical foundation/tracking migrations create the User/Auth foreign key, exact financial records, composite ownership foreign keys, per-user policies and FORCE RLS. Telegram/integrations/assistant/notifications and later appearance/productivity changes are retained for schema compatibility. Retired bank columns may exist; bank activation remains disabled. Commercial foundation removes the singleton constraint/index/column only on an empty separate installation. Lifecycle adds active-customer restrictions and fixed self-erasure. Billing adds isolated service privileges, catalog, canonical subscription/refund ledgers and atomic usage/spend reservations. Intelligence creates customer-owned history/reports/preferences. Workers introduce narrow routing/lease/erasure functions. Admin adds separate MFA membership and aggregate-only functions. Experience adds owned voice/profile preferences. Hardening adds fixed storage/request accounting, retention and installation checks.

Security checks apply all migrations to embedded PostgreSQL: all customer-owned tables force RLS; browser roles have no application table grants; every public security-definer function fixes search_path and denies browser execution. New runtime logins inherit one intended group, have no elevated attributes or object ownership and bounded connections. Existing cross-customer tests cover records, links, billing, erasure, jobs and aggregates. The worker group intentionally inherits app scope; worker application code sets a freshly claimed customer per transaction. That service credential is privileged across tenants and must remain server-side.

Additional pre-DDL safeguards now pin the exact commercial project, reject unmarked databases with existing relations or reserved Pluto roles, and require the matching installation marker on upgrades. An uninitialized/partially migrated database is not silently adopted. Future recovery needs separate review. A read-only inspector is prepared (setup:inspect; default offline, --connect uses SET TRANSACTION READ ONLY). Administrative changes still require explicit approval and credentials. Existing login passwords are never overwritten by role provisioning.

Not proven locally: actual Supabase admin/group privileges, provider-default grants, remote schema emptiness, network reachability, Auth settings/delivery or recovery. Hosted preflight and independent security review remain necessary. Do not import the Render template, execute migration approval, create roles or activate providers merely because this review exists.

| Migration | Normalized bytes | SHA-256 prefix |
|---|---:|---|
| 20261015000000_foundation | 3456 | d5f8efbdcd7b6bcd |
| 20261016000000_core_tracking | 41042 | 11bdb29322f651b2 |
| 20261016010000_telegram | 3269 | e50efe35c8ac00be |
| 20261016020000_integrations | 9140 | 8cd7570a9bf81f57 |
| 20261016030000_assistant | 1987 | 5e682f065292ade1 |
| 20261016040000_notifications | 3677 | 7afcd0800a9923ac |
| 20261016050000_data_controls | 367 | bfb732b8f0f421e5 |
| 20261016060000_security | 384 | 34e4364421a36ba2 |
| 20261017000000_notification_frequency | 527 | 780c3383344c0cad |
| 20261017010000_apple_calendar | 248 | e4dcdf4e190ff784 |
| 20261017020000_bank_history | 675 | b6e32af172bb6fd8 |
| 20261019000000_appearance | 529 | a05e3cb220705a23 |
| 20261020000000_background | 202 | 3ed8f6301356dc72 |
| 20261020010000_tertiary_color | 206 | 817ed8dae9175f86 |
| 20261020020000_wordmark_styles | 301 | 9437ced2b13db4c9 |
| 20261020030000_clock_format | 191 | 0e362befd98e2934 |
| 20261021000000_productivity | 3312 | eb51176a5faf646d |
| 20261021010000_note_capacity | 61 | cf8c601984de7fc8 |
| 20261022000000_pluto_foundation | 2696 | e8c2ef600d08abba |
| 20261022010000_pluto_lifecycle | 3329 | 3b9abb298eef9942 |
| 20261022020000_pluto_billing | 12809 | 5610af42a37693a7 |
| 20261022030000_pluto_intelligence | 3616 | f7ec22fba05e2751 |
| 20261022040000_pluto_workers | 9569 | f2adbc9c61fe3548 |
| 20261022050000_pluto_admin | 15206 | 6c024a94f9f702e4 |
| 20261022060000_pluto_experience | 2227 | 27b9e67a87b75dab |
| 20261022070000_pluto_hardening | 9386 | 77d1c46fb26f3d2b |
