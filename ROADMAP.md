# Roadmap

See IMPLEMENTATION_PLAN.md for dependencies, acceptance criteria and status.

1. Foundation: complete and pushed to GitHub, including live Supabase migration/persistence/least-privilege access and owner-confirmed login/logout.
2. Core tracking: implemented; finances, academics, calendar/tasks, career, projects, goals/habits and notes. Final verification recorded in IMPLEMENTATION_PLAN.md.
3. Telegram: locally paired and verified for status, note synchronization, undo and persistence across polling restart. Retry failures are covered automatically.
4. Connectors: read-only adapters, synthetic providers, encrypted authorization, source review/health and financial CSV implemented. Real account approval and key custody remain explicit setup steps.
5. Grounded assistant: local validated tools, saved sources/freshness, requested rule-based recommendations and on-demand weekly reviews implemented. Optional OpenAI question interpretation awaits owner API setup. Full conversational reasoning is not implemented. See ASSISTANT.md.
6. Notifications and release: durable jobs, delivery, security hardening, backup/export/deletion and deployment approval.

Phases 1–4 are locally verified. Phase 5 local analysis and the optional question interpreter are implemented and tested; real OpenAI activation remains separate. No phase advances until its predecessor's acceptance gates are verified and further work is authorized. Release-level session hardening and physical-device checks remain documented in Phase 6.
