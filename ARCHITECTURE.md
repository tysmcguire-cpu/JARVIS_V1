# Architecture

Current implementation includes all six phases. Assistant uses static read-only queries and exact finance aggregates. Optional OpenAI interpretation shares the consented question; separately consented composition shares bounded factual summaries, preserves immutable facts and validates source references. Full notes/history are excluded. Conversation/source snapshots commit atomically. Phase 6 adds owner-scoped notification jobs/attempts with fenced leases, a separate explicit worker, MFA enforcement and transactional recovery controls. See ASSISTANT.md, NOTIFICATIONS.md and RECOVERY.md.

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

## Inline Notes editor

Notes retain the left index/right reading-pane layout, with directly editable title, tag and rich text. Tiptap 3.32.0 and its Markdown bridge load lazily only for Notes. The existing Note.content stores portable Markdown; plain-text records remain compatible. The editor supports basic formatting, undo/redo and explicit saves, with no image/link schemas or remote content. Clipboard HTML is discarded in favor of plain text.

The complete document stays mounted while a clipped, line-aligned viewport pages through it. Selection changes reveal the caret's page. This preserves the desktop-only minimum 1024×600, single-viewport/no-scrolling owner override. Draft guards cover note selection, filters, reload, application navigation and browser closing. Failed saves preserve the draft.

The inline action independently verifies the owner before validation; the repository independently establishes owner database scope. Parameterized updates require the previous timestamp, return a monotonic version and write their audit entry atomically. Stale updates fail without replacing newer content. No schema migration or external service is involved.

## Phase 3 Telegram boundary

`src/features/telegram` owns configuration, deterministic parsing, owner pairing, command processing and plain-text transport. Browser actions use requireOwner/withOwnerDatabase; the webhook first verifies its header secret, then approved sender/private-chat IDs, then the persistent owner pairing. The polling runner obtains updates from the configured Telegram bot and uses the same ID/pairing checks. Bot commands use a separate server-only database boundary that sets the configured owner claim locally and independently verifies the real owner record. It does not manufacture a browser session.

Incoming text is never retained. Operation results and undo metadata are persisted with bot/update-ID uniqueness. Domain writes, operation audit and update receipt share one transaction, serialized by an owner advisory lock. Reply delivery occurs after commit with leases and retry deadlines. Restarting polling replays unacknowledged updates safely. Provider delivery cannot be exactly once after an ambiguous network result, but storage operations remain deduplicated.

Only `/api/telegram/webhook` bypasses browser-session proxy checks; the route independently fails closed with no Telegram config/secret, validates JSON body size and never exposes provider/DB error details. No public host or webhook registration exists. `telegram:poll` and `telegram:replies` are explicit local processes, not background jobs automatically started by Next.js.

## Phase 4 sources and CSV

The integrations feature separates bounded parsing, reusable sync/normalization, synthetic providers, fixed-endpoint HTTP adapters, encrypted grants and owner repositories. Network calls run outside database transactions. Refreshed credentials are committed before reads; page upserts are idempotent and cursor advancement waits for completion. Renewable leases prevent replaced/disconnected workers from persisting results. Canvas reconciles missing IDs only after a complete selected-course snapshot.

CsvImportBatch stores validated, expiring server plans. Confirmation rechecks account currency, category types, receipts and new duplicates. A parameterized CTE inserts new source keys and matching transactions, followed by counts/audit in the same transaction. Bank IDs deduplicate overlapping exports; no-ID files use exact-file/row identity and explicit review. Receipts survive transaction edits/deletion. Optional Transaction.csvBatchId links provenance.

Source snapshots never overwrite manual records and render only as text. AES-GCM envelopes authenticate owner/connection/provider context. No encryption key or custody service is chosen automatically. Status responses omit credentials. Telegram pairing/polling survived the local client restart.

## Shared module visual layer

module-polish.css loads after feature and appearance styles and scopes its rules to app shells excluding the dashboard. It preserves existing layout grids and behavior, uses protected palette variables for accents, and adds surface/typography/interaction consistency. Roomier spacing applies only at heights of at least 760px and widths of at least 1200px; compact geometry preserves the desktop-only 1024×600 no-scroll override. Reduced-motion removes control transitions. Feature-specific sizing, including the rich-note 22px pagination rhythm, remains authoritative.

## Contextual module rail

TrackingWorkspace now separates module-rail (identity, creation action, record sections) from module-body (filters, records and pagination). SettingsPanels, NotificationPanel and AssistantPanel share the module-layout grid. module-rail.css retains the bounded desktop sizing and protected appearance tokens. Shell defaults module pages to compact primary navigation, preserving explicit accessible link names and an expansion button. No dashboard grid, server data boundary or action semantics changed.
