# Integrations

Current available providers: Google Calendar, Apple Calendar (iCloud), GitHub and Canvas, plus financial CSV imports. Calendar sync is optional; either provider can be configured independently or both can coexist. Gmail and Google Drive were removed from integration settings at the owner's request. No calendar authorization/discovery/sync was performed by the build. See CALENDAR_CONNECTIONS.md for setup, read-only behavior and live acceptance limits. Historical Phase 4 notes below preserve earlier scope.

Current status: Supabase and the owner-paired Telegram bot are configured locally. Phase 4 adds financial CSV imports and five read-only provider adapters, with synthetic tests, encrypted authorization and source review. No Calendar, Gmail, GitHub app connector, Canvas or Drive account has been connected during implementation. Git credentials are not reused by the app.

See [the Phase 4 setup and operating guide](INTEGRATIONS_PHASE4.md) for current CSV, authorization, key-custody and sync instructions. Financial CSV does not need a provider token or encryption key. Real provider authorization remains disabled until key custody is chosen and the local encryption key is configured.

## Historical Foundation and Phase 3 planning notes

No external integrations are active. Supabase configuration is the only external prerequisite for Foundation owner authentication and persistence. Local synthetic preview has no account dependencies.

Phase 4 connector contract must cover authorize, refresh, paginate/fetch, normalize, incremental cursor, owner-scoped idempotent upsert, retry/backoff, rate limits, health and disconnect. Implement deterministic mock providers first. Store encrypted tokens server-side only after key management is decided. Never scrape or bypass permissions.

| Provider | Future authorization requirement | Intended access |
| --- | --- | --- |
| Google Calendar | OAuth app and explicit calendar consent | Read events |
| Gmail | OAuth consent; review restricted scopes as applicable | Selected authorized mail reads |
| GitHub | Fine-grained token or GitHub App with selected repositories | Read repository/project data |
| Canvas LMS | Institution-authorized API token and base URL | Read selected courses/deadlines |
| Google Drive | OAuth selected-file permissions where possible | Read selected resources |
| Financial CSV | User-selected file, validated parser | Internal import only |
| Telegram (Phase 3) | Bot token, webhook secret, verified owner chat/user | Internal commands and approved notifications |
| OpenAI (Phase 5) | Server-only API key and cost controls | Requested grounded analysis only |

Exact scopes and provider approval requirements must be rechecked against official documentation when connectors are implemented. No real account access, paid API use or deployment is authorized now. Telegram is not assumed end-to-end encrypted. Later notifications require durable workers independent of browser sessions.

## Telegram implementation status

Phase 3 command handling and local setup are implemented; see TELEGRAM.md. TELEGRAM_ENABLED defaults to false, the bot token and approved IDs are missing, and no bot connection/webhook is claimed. Local polling is the primary mode on this computer. It requires no hosting or tunnel. The webhook endpoint is prepared for a separately authorized HTTPS deployment. No API call or message to a real bot was made during implementation.

## Chase bank transaction history (2026-10-17)

Read-only Chase/Plaid Transactions connection, encrypted owner-bound grant and OAuth session, periodic hosted-worker sync, atomic cursor reconciliation, pending-to-posted replacement, and paginated Finances bank history are implemented. Production is disabled without explicit free Trial confirmation and owner credentials/consent. No live bank connection has been tested. Existing manual ledger and alerts do not automatically include bank records. Additive bank-history migration extends existing provider/kind constraints and indexes; no new database role or paid worker is required. Revoke the bank Item before app-data deletion or snapshot replacement; backups exclude credentials and restores disconnect providers. See [CHASE_BANK_SETUP.md](CHASE_BANK_SETUP.md) for activation, free Trial limits and recovery details.

## Finance workflow update

Use Telegram +400 / -20 food and the Finances log/charts. Automatic Plaid processing and new-bank setup are retired. No bank keys or new service are needed. Existing bank grants are retained only for explicit revocation. See [FINANCE_LOGGING.md](FINANCE_LOGGING.md).
