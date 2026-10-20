# JARVIS contributor instructions

Read JARVIS_SPEC.md in full before development; it is the primary requirements source. Read IMPLEMENTATION_PLAN.md for phase scope, architecture decisions and verified status. Do not proceed to Phase 2 until Foundation's live Supabase configuration and acceptance checks are verified. Preserve the complete specification.

Latest owner UI override: desktop-only, minimum viewport 1024×600, with the entire current application fitting one screen without page/panel scrolling. This supersedes the original responsive/iPhone UI requirement until the owner changes direction. Keep the original master specification intact and record the override in implementation documentation. Use pagination/tabs/drill-down for future content rather than growing pages indefinitely. The central JARVIS graphic is an original flowing cyan/violet ribbon animation, not live AI or telemetry.

Use synthetic demonstration data only until the owner explicitly configures private data sources. Never invent credentials, connect real financial accounts, perform autonomous external actions, spend money or deploy without authorization. Never claim a check or connection succeeded unless it was executed and verified. Keep secrets server-side and out of Git. Verify the owner independently in every data action or repository; proxy/layout checks alone are insufficient.

Owner integration preference: hide Gmail and Google Drive from integration settings. Calendar sync stays optional; offer independent Google Calendar and Apple Calendar (iCloud) connections so either or both can be used. Do not authorize, discover or sync either account until the owner explicitly chooses to connect it. Keep provider access read-only.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Owner finance override: use manual transaction logging through Telegram (+400, -20 food) instead of automatic bank downloads. Finances defaults to the logged transactions on the left, with category pie/daily spending charts on the right. Do not re-enable Plaid workers or new bank setup. Preserve previous credentials only for explicit revocation. Keep general UI plain: remove slogans, phase labels and redundant decorative boxes.

Latest owner finance/presentation override: the default Finances overview combines the transaction log, spending charts and budget preview. Transactions is a separate full-width list. Assignments use six-row pages with clear totals/ranges and direct page selection. Keep shared text readable and preserve Settings → Appearance account-persisted primary/secondary palette controls.

Latest budgets override: expose one Budgets tab, with a paginated budget list on the left and remaining-spend bars on the right. The add/edit form has Label, Category (type an existing or new expense category), and Limit. New budgets use the selected month/currency; preserve existing periods and other allocations when editing. Module tabs/filter controls use the primary palette on hover/focus, including selected tabs. Category identity includes expense/income type; do not merge or reclassify owner records based on matching names alone.

Accounts includes a per-account monthly ledger-balance line chart reconstructed from opening balance and logged entries, with exact values and no future-dated points. Keep currencies/accounts separate; do not label reconstruction as bank history. Preserve raw saved palette hex codes while applying contrast-protected display shades to essential UI and canvas colors.
