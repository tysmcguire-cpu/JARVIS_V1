# Local navigation investigation — October 16, 2026

The signed-in browser reproduced ~2.4-second module/tab changes. Server logs showed repeated remote authentication calls, sequential SQL round trips and development compilation. A transaction's Promise.all would still serialize its database work; batching the SQL is the substantive fix.

- Tracking now returns rows, page/count, related choices/current selected links, currency, summaries, chart and calendar in one PostgreSQL statement. Exact money stays text through JSON transport. Owner predicates/RLS remain in place; no owner data cache was added.
- Request-scoped React memoization deduplicates render authentication; AsyncLocalStorage deduplicates explicitly verified action/route scopes only. Every separate request still verifies getUser, including revoked sessions. Proxy preflight uses signature/expiry-verified getClaims; this is not the final data authorization check. See the [Supabase method documentation](https://supabase.com/docs/reference/javascript/auth-getclaims).
- Filter reads use a private no-store, same-origin POST endpoint instead of the server-action queue and its extra page work. Superseded/unmounted requests abort on the client; generation checks reject stale responses. Writes retain their existing audited server actions.
- Navigation warms the intended destination on hover/focus rather than eagerly querying every visible module. A pending indicator provides immediate feedback.
- For normal local use, build then run `pnpm local`, binding the optimized server to loopback; `pnpm dev` recompiles routes on demand and is intended for active editing. Restart the production server after each new build. Browser test servers use their separate output directory.

The warmed optimized filter measured ~1.1 seconds including browser interaction, versus ~2.4 seconds initially; the corresponding server request was 801ms. These are local observations, not a universal latency guarantee. Supabase network round trips still affect uncached fresh reads. Tests assert a single tracking read statement for all 24 types, exact values, page clamping, selected links beyond 500 choices, owner boundaries and request-local authentication isolation.

The subsequent signed-in optimized production interaction measured 845ms, approximately 65% below the original observation. Performance changes are committed in b72b86c. Phase 6 notification state and job insertion likewise batch their database work rather than making a request per row.
