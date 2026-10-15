# Integrations

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
