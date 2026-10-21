# Pluto billing and usage controls

## Implemented, not yet connected to a real Stripe test account
Stripe SDK is pinned by pnpm-lock.yaml (23.0.0). Server-authenticated Checkout and Customer Portal, bounded raw-body signature verification, five-minute replay tolerance, mode matching, idempotent BillingEvent processing and current-state reconciliation are implemented. Webhooks serialize by customer and retrieve canonical subscriptions rather than trusting stale payload status or browser metadata. Tests use the actual Stripe signature utility and mocked Stripe API responses, with PostgreSQL roles/RLS. Real Checkout/Portal delivery remains an owner acceptance gate.

Free / Plus / Pro monthly working prices are USD 0 / 9.99 / 19.99. Ultimate 39.99 is prepared but inactive. Catalog prices/quotas live in PlanCatalog; price IDs are server configuration. Monthly Stripe prices must match the catalog amount/currency/cadence. Annual subscriptions additionally require explicit approved annual cents, so no discount is invented. Checkout intents and Stripe idempotency keys prevent competing checkout creation. Existing subscriptions use the portal for upgrades/downgrades/cancellation. No card details are stored. Stripe portal product/price, proration, cancellation and tax settings require owner configuration.

## Authority and money
A separate restricted pluto_billing runtime role can update billing cache/events/ledger and read catalog, but cannot read private tracking records. The customer runtime only reads its own billing/usage rows and cannot promote itself. Signature-verified webhook and authenticated checkout are distinct entry points; a billing credential never replaces customer authentication.

Ledger distinguishes cash collected, failed-payment amounts and cumulative charge refunds. Recurring revenue uses active subscription amounts normalized into integer USD microdollars; annual amounts divide by twelve with sub-microdollar truncation. Cash uses exact Stripe integer minor units and preserves currency. Refunds do not automatically cancel a subscription: Stripe's current subscription state remains authoritative. RevenueMovement records new/expansion/contraction/churn changes separately. Estimated AI costs are not Stripe cash or actual net profit.

## Usage
PlanCatalog defaults: messages/month Free15/Plus250/Pro1000; voice seconds0/900/5400; research calls0/20/100; weekly reports0/1/1; concurrency1/2/3. Aggregate token and USD microdollar budgets also apply. BudgetPolicy is disabled with zero global spend by default. Feature flags AND an approved database spend budget are needed before provider calls.

Atomic PostgreSQL advisory locks reserve global and customer cost/token/request/voice/research/concurrency budgets across instances. Calendar-month quotas and weekly report cap use UTC; changing plans does not reset usage. Duplicate request keys cannot execute a provider again through the usage helper. Success settles within reserved caps; failures/timeouts retain worst-case charges, preventing retries from bypassing spend budgets. Expired leases free concurrency but do not refund cost/request reservations. Actual provider bills need separate reconciliation; these costs are estimates.

Paid entitlement requires active Stripe state, unexpired period and a sync within 24h; otherwise it fails down to Free. Scheduled reconciliation must be enabled and verified before paid launch. Trialing/incomplete/past-due/unpaid states do not gain paid entitlement. Legacy unmetered paid Assistant interpretation is disabled; deterministic local analysis is retained.

## Deletion and gates
Pending checkout, active paid subscriptions, stale/unverified Stripe state and in-flight paid requests block erasure. Deletion reconciles Stripe first when a mapping exists. Customer profile locks serialize checkout/deletion. Auth deletion later cascades mappings/subscriptions while billing ledger/revenue/usage retain anonymized operational aggregates. Authentication-removal worker and retention review remain required.

Configure PLUTO_BILLING_DATABASE_URL with a separate pluto_billing_runtime member login; STRIPE_SECRET_KEY (restricted test key preferred), STRIPE_WEBHOOK_SECRET, the price IDs and PLUTO_SITE_URL. Test mode is the default; invalid mode values fail closed. Live keys require PLUTO_BILLING_MODE=live plus PLUTO_BILLING_LIVE_APPROVED=true, separate live price IDs/signing secrets and explicit owner launch approval. Turning checkout OFF stops new purchases while the portal/webhook can continue servicing existing subscriptions.

References: https://docs.stripe.com/webhooks ; https://docs.stripe.com/api/checkout/sessions ; https://docs.stripe.com/api/subscription_items/object . No commercial deployment or Stripe account configuration has been performed.

## Refund and capacity hardening
Refund ledger records use individual canonical Stripe refund IDs, actual created timestamps and succeeded amounts; pending/failed refunds contribute zero. Replayed/status-update events update idempotently. Former aggregate charge refund entries are zeroed to avoid double counting. More than 100 refunds on one charge fails closed for bounded operator reconciliation. Subscribe to refund.created, refund.updated and refund.failed as well as charge.refunded. No real Stripe call was performed during development.
