# Architecture

JARVIS_SPEC.md is the primary source of truth. IMPLEMENTATION_PLAN.md records scope and phase gates.

The application is a modular monolith: Next.js App Router handles rendering and server actions; feature folders own business logic. Supabase provides identity and PostgreSQL; Prisma is server-only. No custom API, AI, Telegram, scheduled workers or external connectors exist in Foundation.

```
src/app/                  routing, layouts, errors, loading, global styles
  (private)/              owner-protected pages
  login/                  password sign-in, no registration
  demo/                   explicit development-only synthetic preview
src/features/auth/        verified identity, owner policy, actions
src/features/dashboard/   read-only dashboard and isolated demo fixtures
src/features/settings/    owner-scoped repository
src/features/shell/       responsive navigation and module placeholders
src/components/ui/        local shadcn/ui-style primitives
src/lib/                  environment, database and Supabase adapters
prisma/                   schema, reviewed SQL migration and guarded seed
scripts/                  explicit owner/role provisioning and live DB verification
tests/                    Vitest policies and Playwright shell tests
```

Private layout checks the Supabase user on the server. Every future data operation must independently invoke requireOwner; layout protection alone does not secure actions or APIs. The proxy refreshes cookies and rejects missing configuration or an unauthorized owner before streaming, preserving actual redirect/404 response statuses. It is an early gate, not a replacement for data-layer authorization. getUser verifies session validity with Supabase. Only the exact server-configured owner UUID is accepted. No session object from the browser establishes trust.

Synthetic routes use fixed fixtures, never repositories. The private dashboard has genuine empty states, not synthetic owner facts. Module pages are explicitly labeled placeholders. Private Settings reads persisted preferences through withOwnerDatabase, which independently verifies the owner and sets auth.uid's request claim locally inside a Prisma transaction. The SELECT-only jarvis_app role is subject to RLS; unscoped/other-owner reads return no records. Explicit owner predicates remain required. Transaction-local claims cannot leak between pooled requests. Demo settings remain static synthetic examples; editing and notification delivery are deferred.

Prisma 6.19 is deliberately retained for its established PostgreSQL engine and directUrl support; a future Prisma 7 upgrade requires adapter/config migration. Next/React and ESLint config versions are locked together in pnpm-lock.yaml. Use frozen-lockfile installs.

No services are hosted or paid for by this repository. Phase 6 must choose a persistent job runner: Vercel request handlers alone are not a durable scheduler. No secrets/token encryption is claimed until a real connector and encryption key policy exist.

Development/build scripts explicitly use Webpack. Turbopack's CSS worker failed to start on this Windows runtime even outside the sandbox; Webpack compiled successfully. This is a tooling choice, with no change to application behavior. Next.js generated AGENTS.md is retained for future contributors.
