# Pluto verification log

## Baseline
Personal starting commit: 7dd529712d5e1745358898a3106a693c929f996a. Its prior recorded suite was 226 tests. Those results are historical; isolated commercial checks have not yet run. Dependency installation used the existing frozen lockfile without secrets. No live database/provider/deployment tests executed.

## Foundation implementation checks (in progress)
Isolated baseline: all 226 tests passed. After customer/name migration, 226/227 initially passed; the worker import fixture was corrected to use a pinned synthetic commercial URL rather than a forbidden loopback URL. Focused auth/migration/worker checks passed (23 tests), followed by customer boundary/tenancy/worker checks (12 tests). TypeScript and ESLint passed. No live database/provider acceptance performed. Full foundation validation is next.

## Phase 1 local acceptance
All 239 unit/database tests passed (43 files), including commercial migration refusal, two runtime customers, cross-tenant finance FK/write rejection, verified multi-customer sessions, account-status boundary and signup/recovery flag/auth tests. Two new browser scenarios passed for Pluto branding, disabled registration, private-route/callback denial and generic recovery. Prisma validation used dummy URLs without connecting. TypeScript, production build and ESLint passed; dynamic auth pages explicitly avoid configuration-dependent static caching. Live email, Supabase and deployed acceptance remain unverified.

## Phase 2 tracking and lifecycle checks
Fourteen focused tests passed across the real customer database boundary, all 24 existing tracking record types for two independent customers, cross-customer reference/delete/export rejection, self erasure with a durable tombstone and untouched second customer, backup/export compatibility, and customer-status checks. A failed first run exposed row-lock visibility for deleted profiles; the lifecycle policy now permits locking self while WITH CHECK still forbids inactive mutation/reactivation. TypeScript passed after the correction. Actual Auth removal remains a queued operation pending the dedicated worker and commercial credentials. Browser tracking checks follow.

Phase 2 browser acceptance: all seven selected scenarios passed for calendar day creation, finance overview/transaction list/budgets, assignment pagination, every tracking tab at minimum desktop size, note CRUD and linked forms. ESLint, Prisma generation and TypeScript passed.

## Phase 3 local acceptance
All 257 unit/database tests passed (47 files). New cases cover disabled global budgets, Free quotas, concurrent logical reservations, replay keys, settlement ownership, worst-case failure accounting, global caps, canceled/past-due entitlement, billing-role private-table denial, canonical Stripe replay/out-of-order state, payment failure, exact cumulative refunds, unknown prices, checkout intent/idempotency and raw signature/time/mode/size rejection. Two billing browser scenarios passed for subscription UI/inactive Ultimate/disabled purchases and webhook authentication independent of sessions. Prisma validation/generation, TypeScript/production build and ESLint passed (one unused test import warning was removed). Three production boundary tests passed. The 54-asset client scan found none of three injected synthetic private sentinels. No real secrets were used for that check.
Concurrent requests run against embedded PostgreSQL's transaction scheduler; real multi-connection load testing remains part of hosted hardening. No real Stripe API, Checkout/Portal, customer, invoice, webhook delivery or paid provider call occurred. All real infrastructure acceptance is pending owner setup.
