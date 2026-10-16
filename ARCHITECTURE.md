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

## Command-center visual system

The owner-authorized visual refresh stays within Foundation; Phase 2 remains deferred. command-theme.css layers a dark navy/cyan instrument aesthetic over the structural stylesheet: fine background grids, restrained glow, corner-framed panels, monospaced labels and responsive navigation. CommandCore is an original decorative SVG, not an AI, CPU, memory or connection monitor. Reduced-motion preferences disable rotation. InterfaceClock displays actual browser-local time without announcing every second to assistive technology. Navigation distinguishes the existing Foundation settings from planned modules and accurately states that no domain integrations are connected. Login and all modules share the theme. No supplied reference images, stock assets, external fonts, new dependencies or backend features are introduced.

The dashboard was subsequently redesigned as an immersive orbital navigation console. OrbitalDashboard places ten real module links around CommandCore on desktop, with SVG connections that highlight on hover/focus and a center destination preview. On tablets/phones, the core sits above a two-column touch target grid. The dashboard hides the duplicate desktop sidebar; module pages retain it and mobile navigation remains available. Orbital-dashboard.css owns the layout and decorative scanner, particles, data trails and waveform animations. A pause control stops interface animation, and OS reduced-motion disables it. These effects depict the interface only, never live monitoring, AI activity or external data. Classic dashboard metric/task cards were removed from the landing screen; no tracking functionality or backend was added.

Latest owner override: desktop-only, single viewport, no page/panel scrolling. desktop-workspace.css fixes shell/header/footer geometry, sizes the dashboard from remaining viewport space, compresses existing Settings/sign-in content as needed and replaces the mobile layout with a clear minimum-window notice below 1024×600. This explicitly supersedes previous mobile-layout decisions; the master specification remains preserved. Future data-heavy modules need bounded tabs/pagination/drill-down.

The dashboard now renders FlowingCore instead of the mechanical CommandCore (which remains on sign-in). FlowingCore draws original time-deformed cyan/violet filaments, subtle circuitry and a JARVIS wordmark using a local canvas plus accessible structural HTML. Rendering is capped at 24fps and device pixel ratio 1.25, stops when hidden/paused/reduced-motion, and retains animation time across pause/resume. No images or external rendering services are used. Desktop tests verify changing canvas frames, motion state, module bounds and no document scrolling rather than merely hiding overflow.

## Phase 2 tracking architecture

`src/features/tracking/entities.json` defines the 24 trusted entity/field names used by the shared bounded UI, validator and SQL repository. Prisma models and the reviewed migration define normalized storage; this is not a generic JSON record store. All SQL values are parameters. Only statically allowlisted table/column identifiers enter SQL strings. Every repository call uses withOwnerDatabase, independently verifying the Supabase owner and setting the transaction-local identity. Actions verify authentication before returning any validation or data. Composite ownership foreign keys and forced RLS protect linked records.

Tracking CRUD grants apply only to the new domain tables; owner/settings remain read-only. Audit INSERT is restricted to the owner, tracking action prefix and success outcome. Failed domain writes roll back their audit entry. Browser anon/authenticated roles have no tracking table privileges; all tracking access is server-side. This computer uses a separate login inheriting jarvis_app membership; the original login remains usable on the other computer.

Record reads are paginated, sorting/search bounded, linked option search limited to 50 results per query, and calendars capped at 200 matching dates per month. Exact currency totals use PostgreSQL bigint and JavaScript bigint, separated by currency. Chart widths alone convert amounts to numbers. Row timestamps are normalized to milliseconds and monotonically increase to detect stale edits without silently replacing newer changes. Domain parent deletion is restricted; owner deletion still cascades through all domain records.
