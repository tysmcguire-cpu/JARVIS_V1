# Roadmap

See IMPLEMENTATION_PLAN.md for dependencies, acceptance criteria and status.

1. Foundation: complete and pushed to GitHub, including live Supabase migration/persistence/least-privilege access and owner-confirmed login/logout.
2. Core tracking: implemented; finances, academics, calendar/tasks, career, projects, goals/habits and notes. Final verification recorded in IMPLEMENTATION_PLAN.md.
3. Telegram: locally paired and verified for status, note synchronization, undo and persistence across polling restart. Retry failures are covered automatically.
4. Connectors: read-only adapters, synthetic providers, encrypted authorization, source review/health and financial CSV implemented. Real account approval and key custody remain explicit setup steps.
5. Grounded assistant: local validated tools, saved sources/freshness, requested recommendations and weekly reviews implemented. Optional OpenAI interpretation and separately consented grounded composition await owner API setup. See ASSISTANT.md.
6. Notifications and release: durable jobs/retries, scheduled reviews/deadlines/financial alerts, MFA enforcement, browser-role hardening, encrypted backup/restore and export/deletion are implemented and tested. See NOTIFICATIONS.md and RECOVERY.md.

All six implementation phases are locally built and verified within configured services. Real OpenAI/provider acceptance, owner MFA enrollment/recovery rehearsal, actual backup custody, scheduled Telegram activation and deployment remain owner setup gates, not completed live integrations. See OWNER_SETUP.md. The original specification is unchanged; historical implementation notes preserve earlier scope/status.
