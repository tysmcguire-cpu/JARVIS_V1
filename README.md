# JARVIS

Private, single-owner personal operating system. All six implementation phases are built locally: owner-scoped tracking, paired Telegram commands, read-only connector adapters and CSV imports, grounded Assistant, durable notifications, MFA enforcement and export/recovery/deletion controls. Desktop-only, minimum 1024×600, with pagination and forms fitting one viewport. Supabase and the existing Telegram bot are configured. The desktop website is hosted on Render, and the owner verified Telegram webhook replies and a scheduled reminder. Notification timing, repeat frequency and per-type Telegram delivery are customizable in the app. Optional AI, new providers and backup custody still require owner setup. Start with OWNER_SETUP.md for the remaining checklist.

JARVIS_SPEC.md contains the complete original requirements. Read IMPLEMENTATION_PLAN.md for architecture decisions, phase gates and verification status. See ARCHITECTURE.md, DATABASE.md, SECURITY.md, INTEGRATIONS.md and DEPLOYMENT.md before configuring real services.

## Local setup (Windows / VS Code)

Install Node.js 22.12+ (24 LTS recommended), Git and pnpm 11. Open this folder in VS Code and use its PowerShell terminal. Commands assume these executables are on PATH.

```powershell
pnpm install --frozen-lockfile
if (!(Test-Path .env)) { Copy-Item .env.example .env }
pnpm db:generate
```

For the synthetic preview, set `JARVIS_DEMO_MODE=true` in .env, then:

```powershell
pnpm dev
```

Open http://localhost:3000/demo. All numbers are explicitly synthetic; no database or credentials are needed. Sign-in at /login remains locked until Supabase configuration is complete. Demo is disabled in production builds, so use the development server for preview.

For real owner access on a new Supabase project, follow DATABASE.md to disable signups, manually create the Auth owner, configure .env, apply migrations and run `pnpm db:provision`. That explicit setup command creates owner/settings records plus a SELECT-only runtime role and saves its generated credential only in .env. No service-role API key is needed. The original development project is already migrated/provisioned; do not create a second owner when switching computers.

```powershell
pnpm db:validate
pnpm db:migrate
pnpm db:provision
pnpm db:verify
pnpm db:tracking
pnpm db:verify-tracking
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm test:production
pnpm start
```

The E2E suite starts its own development server on port 3100 with isolated .next-tests output, explicitly clears Supabase configuration and tests desktop navigation, viewport fit, flowing animation/pause/reduced motion and fail-closed routes at 1280×720, 1366×768 and 1920×1080, plus the minimum 1024×600 size. Smaller windows show a desktop-size notice. These tests do not verify a live Supabase connection. `pnpm db:verify` separately tests the configured live database without modifying records. Build needs generated Prisma client but no real credentials. Optional database seeding is explicitly guarded and described in DATABASE.md.

Production smoke tests use the completed build on port 3101 and verify demo is blocked even with its flag enabled. Vitest executes the reviewed migration in embedded PostgreSQL with an emulated Supabase auth schema, checking defaults, singleton/auth constraints, RLS and cascading deletion. This does not replace verification on the user's Supabase project.

## Phase 1 acceptance

- Live migration, owner/settings persistence, initial preferences, least-privilege runtime role, owner-scoped RLS, second-user database isolation and write/auth-table denial have been executed successfully.
- The owner confirmed successful login, database-backed Settings, logout and login again. No owner password was shared with the assistant.
- Automated auth-boundary tests cover absent, wrong-owner, invalid/revoked sessions and wrong-password responses using mocked provider responses; they do not impersonate real users.
- Actual additional-account testing, long-running refresh/expiry/revocation and MFA remain release-hardening checks in Phase 6. The owner subsequently replaced mobile support with a desktop-only, single-viewport requirement; physical iPhone support is no longer a current acceptance requirement.

## Continue on another computer

After the GitHub push, clone https://github.com/tysmcguire-cpu/JARVIS_V1.git outside OneDrive if possible. Install the required Node/pnpm versions, run `pnpm install --frozen-lockfile` and `pnpm db:generate`, then create .env locally. Transfer the existing environment securely, including the generated jarvis_app DATABASE_URL credential, or provision separate approved runtime credentials. Do not paste secrets into chat or Git. Use the same Supabase project to share persisted data; no new owner or seed is needed. Run `pnpm db:verify`, then `pnpm dev` and sign in. Push changes before switching computers, and pull before editing on the other one.

Phase 2 adds manual data entry; future phases add integrations, AI and durable notifications. Do not enter private records into synthetic fixtures.

## Windows troubleshooting

This checkout is inside OneDrive. During verification, OneDrive marked generated .next directories read-only and interrupted a repeat build. Clearing the read-only attributes on that generated directory allowed rebuilding. For reliable ongoing development, keep the working checkout outside synchronized folders; never remove source files to fix build artifacts. The scripts use Webpack because the bundled Windows runtime failed to launch Turbopack's CSS worker.

Phase 1 is committed and pushed to the master branch at https://github.com/tysmcguire-cpu/JARVIS_V1.git. Remote read/write access is verified. The repository-local Git author is configured from the owner's supplied name and email. Local .env credentials and generated output remain excluded.

## Phase 2 use and switching computers

Sign in at `/login`, then open a workspace module. Create parent records first (accounts/categories, courses, applications, projects or goals), then link their children. Use module tabs, Search, sorting, status filters and pagination. Open/edit reveals all fields; multi-page forms check every field on save. Delete requires explicit confirmation and refuses records with dependent children. Concurrent edits require reloading. Notes support up to 8,000 characters. The synthetic `/demo` workspace supports temporary edits isolated from private storage; reloading resets its records.

The existing Supabase project is migrated for Phase 2. On the other computer, commit/push existing code before pulling, then run `pnpm install --frozen-lockfile` and `pnpm db:generate` with the app stopped (Windows locks Prisma engine files while running). Keep that computer's `.env` and original jarvis_app password. Its role already has the new tracking permissions. For a separate development project, follow Foundation provisioning, deploy migrations, run `pnpm db:tracking`, then both verification scripts. Never use the administrative DIRECT_URL as runtime DATABASE_URL. `db:verify-tracking` exercises synthetic CRUD in an intentionally rolled-back transaction; it saves no sample records.

## Adding events from the calendar

Select a day in Calendar, then choose **Add event**. The form fills both dates with the selected day; adjust dates, times and location before saving. Existing items remain visible in the day details. This works from Events, Tasks and Reminders and creates an internal JARVIS event.

## Editing notes

Select a note to edit its title, tag and contents directly in the existing reading pane. Use the toolbar for bold, italic, strikethrough, headings, paragraphs, lists, quotes and inline code, plus undo/redo. Choose **Save note** or press Ctrl/Cmd+S; **Discard changes** restores the last saved version. Saving is explicit, not automatic. Drafts stay in memory, and leaving an unsaved note prompts for confirmation.

Long notes use Previous/Next section controls without scrolling or splitting their stored contents. The 8,000-character limit includes Markdown formatting. Existing plain-text notes remain supported. Pasted content is plain text; links, images and remote embeds are not enabled. No database migration is needed.

## Telegram on the primary computer

This computer is the primary development workspace. Phase 3 command processing, protected pairing, Settings controls, local polling and a secure webhook endpoint are implemented. Telegram is enabled and paired locally. See TELEGRAM.md for BotFather setup, safe numeric-ID identification and pairing; never send bot tokens in chat. `pnpm telegram:poll` runs locally without a public tunnel. The app can continue running at localhost:3000 without Telegram. Real owner pairing, status replies and note synchronization are verified; live undo and restart/retry checks remain.

## Integrations and financial CSV

Finances → Budgets combines category allocations into a single list and remaining-spend graph. Choose month/currency in the toolbar, then add a budget using Label, Category and Limit. Typing a new category creates an expense category in the same transaction; existing names are matched ignoring case and repeated whitespace. Editing preserves the saved period/currency. Spending includes only expenses in that period and currency; overspending is shown explicitly. Existing grouped allocations remain separate editable rows. Category choices show expense/income types, since matching names across those types can be legitimate. No migration is needed for this UI change.

Finances → Accounts shows a monthly balance line chart for the selected account on the current page. Select an account, choose a month, and use the Balance date slider (including keyboard Home/End/arrows) for exact daily values. Opening balance is treated as the initial ledger baseline; the chart reconstructs subsequent daily closing balances from recorded income/expenses, not bank snapshots. Prior transactions carry into the opening point, currencies never combine, and future days are not plotted. Settings → Appearance keeps your original hex codes but automatically lightens/darkens displayed shades when needed for contrast; controls and charts use the protected palette, including the JARVIS canvas. No migration or new external connection is required.

The Assistant is available for local grounded analysis and on-demand weekly reviews. Optional OpenAI question interpretation stays disabled until API key/model/billing are configured locally. See ASSISTANT.md for scope, privacy, setup and Telegram `/ask`. Record contents remain local; it is not a general conversational chatbot.

Open Settings → Integrations and CSV. CSV import supports account/category choice, column/date/sign mapping, paginated preview, duplicate review and atomic confirmation. It writes internal records without connecting a bank. Create the destination account and categories in Finances first.

The five read-only adapters and synthetic tests are implemented, but no Calendar/Gmail/GitHub/Canvas/Drive account is connected. Authorization requires an owner-controlled credential-encryption key, approved provider token and resource selection. Google tokens come from an existing approved OAuth project. Synced snapshots do not overwrite manual tracking. See INTEGRATIONS_PHASE4.md for scope, key custody and limits. CSV needs no provider token or encryption key.

## Clock display

Settings → Appearance → Top-bar time format offers 24-hour (military) and 12-hour (AM/PM). Choose a format and Save palette. The account preference follows you across computers; existing accounts default to 24-hour. It changes only the local top-bar clock, not stored dates, timezone settings or notification schedules. Reset colors preserves the selected format.
