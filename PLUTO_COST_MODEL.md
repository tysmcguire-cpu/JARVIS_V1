# Pluto cost model

USD/month estimates, not capacity guarantees or profit forecasts. No purchases or charged API calls made. Recheck provider prices before purchase. ChatGPT Plus is separate from API billing.

Assume 80% Free, 15% Plus ($9.99), 5% Pro ($19.99). Free uses 10% of 15 messages; paid uses 25% of 250/1,000. Average request: 2,000 input +400 output tokens at gpt-6-luna $0.10/$0.50 per million = $0.0004. Paid users receive 4.345 reports/month at that illustrative size. Research uses 25% of 20/100 limits at $0.005 search +$0.0004 summary. Voice uses 25% of 15/90 input minutes at estimated $0.003/min transcription; answer messages already count above. Actual usage meters tokens conservatively.

US domestic monthly Stripe estimate: 2.9%+$0.30 card processing plus 0.7% Billing, or 3.6%+$0.30 per paying customer. Fractional customer counts at small sizes represent an expected mix. Blended revenue/user $2.498, provider cost/user $0.0254401, Stripe/user $0.149928.

| Registered users | Revenue | AI/search/voice | Stripe | Host+DB budget | Remainder before exclusions |
|---:|---:|---:|---:|---:|---:|
| 0 local development | 0 | 0 | 0 | 0 | 0 |
| 10 | 24.98 | 0.25 | 1.50 | 32 | -8.77 |
| 100 | 249.80 | 2.54 | 14.99 | 32 | 200.26 |
| 1,000 | 2,498 | 25.44 | 149.93 | 55 | 2,267.63 |
| 10,000 | 24,980 | 254.40 | 1,499.28 | 160 | 23,066.32 |

Remainder excludes email, optional domain/monitoring, taxes, refunds/disputes, international/currency fees, labor, support, legal/security review and excess infrastructure usage. It is not net profit. An empty deployed production service still has fixed costs. At 10,000 entirely Free users, assumed text usage costs about $6 plus infrastructure/email/support and produces no revenue; abuse can cost more without controls.

## Infrastructure assumptions

Synthetic closed beta can start at separate Render $7 (512MB/0.5CPU) plus available Supabase Free. Free has 500MB database and may pause after inactivity; do not promise paid production reliability/backups on that basis. Small paid service budget: Render $7 + Supabase Pro $25 = $32/month. Pro includes one Micro compute credit and daily backups. Do not remove personal projects to free an account slot.

Illustrative 1,000-user budget: Render $25 2GB + Supabase Pro/Small compute $30 total = $55. Illustrative 10,000-user budget: Render $85 4GB + Supabase Pro/Medium compute $75 = $160. These plans have NOT been load-qualified for those populations. Actual concurrency, records, query patterns and egress determine capacity. Additional projects/replicas incur more cost.

Basic platform logs add $0 in this table. Reserve optional $20+/month email and $0–25 monitoring as planning allowances, not provider quotes. Sender-domain registration may cost roughly $12–20/year (assumption); Render website URL itself needs no purchased domain. Paid PITR, Redis, vector databases, Kubernetes and paid realtime voice are unnecessary initially.

## Cost controls

BudgetPolicy starts disabled with zero global cap. Per-user Free/Plus/Pro spend caps are $0.10/$2/$6 alongside request/token/voice/research/concurrency limits. Enable providers only with measured global/provider-side caps and alerts at 50/75/90%. Failed dispatch can retain worst-case reservations to prevent retry overspending.

Record caps: 5,000/25,000/100,000; logical data caps: 10/100/500MiB. Installation logical write cap defaults to 128MiB. Logical JSON bytes are not physical database size: indexes, WAL, system tables and retained billing history require headroom. Review actual growth before raising limits. Request windows use constant space per customer.

Investigate sustained 70% RAM/disk/connection use, poor p95 latency, worker lag and repeated capacity failures before purchasing upgrades. No automatic paid upgrade occurs. Real hosted load, email delivery, long-term usage/financial retention and backup size remain acceptance work.

Primary sources: https://developers.openai.com/api/docs/models/gpt-6-luna ; https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe ; https://api-dashboard.search.brave.com/documentation/pricing ; https://stripe.com/pricing ; https://support.stripe.com/questions/stripe-invoicing-pricing ; https://supabase.com/pricing ; https://render.com/pricing
