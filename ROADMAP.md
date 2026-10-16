# Roadmap

See IMPLEMENTATION_PLAN.md for dependencies, acceptance criteria and status.

1. Foundation: complete and pushed to GitHub, including live Supabase migration/persistence/least-privilege access and owner-confirmed login/logout.
2. Core tracking: implemented; finances, academics, calendar/tasks, career, projects, goals/habits and notes. Final verification recorded in IMPLEMENTATION_PLAN.md.
3. Telegram: implementation ready; restricted pairing, webhook verification, commands, deduplication, outbox and undo. Real credentials/pairing checks remain before live activation.
4. Connectors: mocks, OAuth/read-only sync, CSV and health reporting.
5. Grounded assistant: validated tools, sources/freshness, requested analysis and weekly review content.
6. Notifications and release: durable jobs, delivery, security hardening, backup/export/deletion and deployment approval.

Phase 2 is implemented following owner authorization. Phase 3 is implemented but awaits real bot activation checks. Phase 4 is not started. No phase advances until its predecessor's acceptance gates are verified and further work is authorized. Release-level session hardening and physical-device checks remain documented in Phase 6.
