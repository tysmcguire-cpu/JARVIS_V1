# Security model and configuration

Single owner only: manually create the Auth user, disable signups/anonymous auth, configure JARVIS_OWNER_ID server-side. Supabase verifies credentials and applies its managed authentication rate limits. Confirm project rate limits before exposure; do not replace them with an in-memory limiter that fails across serverless instances. Foundation adds no custom public mutation API. Future APIs/webhooks require durable shared rate limiting.

Use a strong unique password and configure Supabase recovery/email delivery privately. A public signup or password reset flow is intentionally absent. The owner confirmed real login, stored Settings, logout and login again. Automated server-boundary tests verify rejection of wrong passwords, second users and invalid/revoked provider responses without creating extra Auth accounts. Long-duration live refresh/expiry/revocation, additional real accounts and MFA are Phase 6 release hardening checks, not claimed as executed now.

Server actions provide framework origin checks; deploy behind correct trusted host/proxy configuration. Auth cookies are HttpOnly, SameSite=Lax and Secure in production. Proxy refreshes tokens and sets no-store; protected routes are dynamic. Every data repository/action must check the verified owner and include ownership predicates. RLS is defense in depth. Never ship privileged Supabase keys to the browser.

The configured jarvis_app runtime role is SELECT-only, cannot bypass RLS or read Supabase identity tables, and requires a transaction-local verified owner claim before it can see records. The explicit db:provision command generates an actual database-role password using the OS cryptographic RNG and saves it only in .env. It never invents a provider key or changes the owner's Auth password. Administrative DIRECT_URL is reserved for local migrations/provisioning and must be kept out of deployed request environments.

Environment files, generated artifacts and dependencies are ignored. Logs contain no passwords, tokens or full records. Supabase Auth maintains authentication audit logs. AuditLog schema is ready for later application mutations. Current errors show generic messages. Security headers prevent framing and MIME sniffing; a full nonce-based CSP, HSTS and dependency/security review are release requirements.

Demo requires an explicit flag and is impossible in production even if the flag is set. It cannot query personal records. No financial services, AI requests, Telegram calls, token storage or autonomous actions are implemented. Transport/storage encryption is provided by configured Supabase; application credential encryption must be implemented before connector secrets are stored. No claim of production security certification is made.

Before production: verify owner isolation via browser and database role, enforce TLS and least privilege, MFA/recovery, backups and restore, retention/export/deletion policy, rate limits, durable audit retention and a threat model for AI prompt injection. AI tools must later return minimal authorized fields, distinguish untrusted content, validate arguments and reject arbitrary SQL/code/external writes.

## Phase 2 tracking boundary

Domain writes are user-initiated server actions with independently verified owner identity, field validation, explicit owner predicates and transaction-local RLS claims. The runtime role has CRUD only on the 24 tracking tables and owner-scoped INSERT into AuditLog; Foundation identity/settings remain SELECT-only. Browser roles cannot read or mutate tracking tables directly. Linked foreign keys include owner identity. Names in raw SQL come exclusively from the static entity registry and values are bound parameters. Audit entries contain operation/outcome only, never notes, amounts or credentials.

Private record mutations include optimistic concurrency checks and explicit UI deletion confirmation. Synthetic demo edits remain client-local and do not bypass server authentication. Database seed refuses existing non-synthetic owners. Live verification rolls back all sample CRUD. No API credentials, webhook handling or external service writes are introduced.
