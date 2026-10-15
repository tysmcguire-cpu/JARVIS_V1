# JARVIS contributor instructions

Read JARVIS_SPEC.md in full before development; it is the primary requirements source. Read IMPLEMENTATION_PLAN.md for phase scope, architecture decisions and verified status. Do not proceed to Phase 2 until Foundation's live Supabase configuration and acceptance checks are verified. Preserve the complete specification.

Use synthetic demonstration data only until the owner explicitly configures private data sources. Never invent credentials, connect real financial accounts, perform autonomous external actions, spend money or deploy without authorization. Never claim a check or connection succeeded unless it was executed and verified. Keep secrets server-side and out of Git. Verify the owner independently in every data action or repository; proxy/layout checks alone are insufficient.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
