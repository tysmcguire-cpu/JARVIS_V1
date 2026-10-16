# Roadmap

See IMPLEMENTATION_PLAN.md for dependencies, acceptance criteria and status.

1. Foundation: complete and pushed to GitHub, including live Supabase migration/persistence/least-privilege access and owner-confirmed login/logout.
2. Core tracking: implemented; finances, academics, calendar/tasks, career, projects, goals/habits and notes. Final verification recorded in IMPLEMENTATION_PLAN.md.
3. Telegram: locally paired and verified for status, note synchronization, undo and persistence across polling restart. Retry failures are covered automatically.
4. Connectors: read-only adapters, synthetic providers, encrypted authorization, source review/health and financial CSV implemented. Real account approval and key custody remain explicit setup steps.
5. Grounded assistant: validated tools, sources/freshness, requested analysis and weekly review content.
6. Notifications and release: durable jobs, delivery, security hardening, backup/export/deletion and deployment approval.

Phase 2 is implemented following owner authorization. Phases 1–3 are locally verified. Phase 4 implementation checks have passed; real provider activation is separate. Phase 5 has not started. No phase advances until its predecessor's acceptance gates are verified and further work is authorized. Release-level session hardening and physical-device checks remain documented in Phase 6.
