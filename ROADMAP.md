# Roadmap

See IMPLEMENTATION_PLAN.md for dependencies, acceptance criteria and status.

1. Foundation: implemented and verified, including live Supabase migration/persistence/least-privilege access and owner-confirmed login/logout. GitHub delivery pending push execution approval.
2. Core tracking: finances, academics, calendar/tasks, career, projects, goals/habits and notes.
3. Telegram: restricted pairing, webhook verification, commands, idempotency and undo.
4. Connectors: mocks, OAuth/read-only sync, CSV and health reporting.
5. Grounded assistant: validated tools, sources/freshness, requested analysis and weekly review content.
6. Notifications and release: durable jobs, delivery, security hardening, backup/export/deletion and deployment approval.

Phase 2 is not started. No phase advances until its predecessor's acceptance gates are verified and further work is authorized. Release-level session hardening and physical-device checks remain documented in Phase 6.
