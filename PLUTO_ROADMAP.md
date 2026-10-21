# Pluto implementation roadmap

Baseline: 7dd529712d5e1745358898a3106a693c929f996a. Branch feature/pluto-saas-v1; original master untouched. Commercial infrastructure is not configured.

| Phase | Status | Acceptance |
| --- | --- | --- |
| 0 Preserve/audit | Complete; 226 baseline tests passed | Clean baseline recorded, isolated checkout, owner checklist and evidence audit |
| 1 Multi-user foundation | Implemented and locally tested; live acceptance pending | Separate environment guard, identity lifecycle, additive schema/RLS, independent tenant tests |
| 2 Tracking | In progress | Existing modules operate under customer scope, cross-tenant read/write/export tests |
| 3 Billing/cost control | Pending | Stripe test flow, signature/replay, entitlements, atomic reservations |
| 4 Intelligence | Pending | Metered authorized chat, durable weekly reports, bounded research |
| 5 Integrations/Telegram | Pending | Tenant pairing/dispatch, read-only credentials, durable jobs |
| 6 Administration | Pending | Explicit MFA role, aggregate metrics/API, revocation and audit |
| 7 Voice/responsive/onboarding | Pending | Disabled paid voice architecture, accessible mobile UI, customer setup |
| 8 Hardening | Pending | Complete test matrix, costs, restore/load/security and beta gate |

No phase is accepted on compilation alone. Real provider/deployment acceptance and independent security review require owner setup. Incomplete work remains explicitly marked.
