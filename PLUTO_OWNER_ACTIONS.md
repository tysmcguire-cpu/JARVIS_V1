# Pluto — owner setup and approval checklist

Status: commercial development only. Not ready for public launch. Do not change your personal JARVIS database, deployment or Telegram bot. Do not paste secrets into chat. This checklist will be updated as implementation and tests establish exact requirements.

## Required before live closed beta
- Create a SEPARATE Supabase project for Pluto. Supply its project URL/reference and publishable key through the commercial environment; keep migration/admin and restricted runtime DB credentials separate. Free project is acceptable for development if available. No personal records should be imported.
- Configure Supabase verified-email signup, email delivery, callback/reset URL allowlists and rate limits for the commercial site. SMTP/email provider approval or payment may be needed at meaningful volume; test actual receipt and recovery.
- Create a Stripe account in TEST mode and separate test API key, webhook signing secret, Plus/Pro monthly and annual prices. Annual price/discount requires your decision; monthly working prices are $9.99/$19.99. Live activation requires account verification and separate approval; no real charges during development.
- Create a NEW Telegram bot through BotFather. Set token/webhook secret only in Pluto environment. Do not replace your personal bot token or webhook.
- Generate separate connector encryption and administrative API secrets locally; arrange secure backup/key custody. Never reuse personal secrets.
- Choose an explicit administrator Auth UUID after creating its account. Enroll MFA before assigning the admin role using the protected provisioning procedure. Customers never gain admin from email or signup order.

## Optional / deferred activation
- AI API billing is separate from ChatGPT Plus. Approve a measured per-user/global budget before activation; put a commercial provider key/model in the environment. Mocked tests need no paid credentials.
- Voice and advanced research remain OFF pending cost approval and provider setup. No real-time paid service will be activated silently.
- Connectors need independent commercial OAuth/provider approvals. Users must be able to use tracking without them.

## Required before public paid launch
- Approve Pluto working name after professional trademark clearance; it is not legally cleared.
- Review draft privacy/terms, retention, refunds/cancellation, business/contact details, selling jurisdiction/taxes and security disclosures with qualified professionals.
- Approve a separate commercial deployment and domain/hosted URL. No changes to personal Render. Hosting purchase and public deployment require your approval.
- Execute real multi-account Supabase, email/recovery, Stripe test checkout/portal/webhook/reconciliation, bot and hosted job acceptance. Local mocks do not establish these.
- Arrange an independent security review, particularly tenant isolation, admin access, financial records and paid usage limits.
- Verify backup restore and rollback against the separate project, then approve closed beta/paid activation stages explicitly.

## Decisions awaiting you (development continues with safe defaults)
Annual discount; business jurisdiction/currency/tax settings; final brand/domain; retention windows; maximum monthly AI spend; invitation-only beta cohort; whether customers may enable Telegram on Free. Safe defaults: USD, Free/Plus/Pro only, no trials, Ultimate inactive, no external actions, all paid providers/public registration/checkout disabled.

## Billing implementation specifics
Use separate pluto_billing_runtime PostgreSQL credentials (member of pluto_billing only), in PLUTO_BILLING_DATABASE_URL. Configure Stripe TEST API/signing keys, monthly price IDs and Portal products/proration/cancellation. Annual billing additionally needs approved total cents in PLUTO_STRIPE_PLUS_ANNUAL_MINOR / PLUTO_STRIPE_PRO_ANNUAL_MINOR plus annual price IDs. Public checkout is OFF. Before AI activation, approve and configure BudgetPolicy's global USD microdollar cap; its initial value is zero and disabled. No real Stripe API call, paid provider request or commercial migration has been executed.

## Intelligence setup
Optional commercial OPENAI_API_KEY, PLUTO_CHAT_MODEL and explicit rate overrides for nondefault models; BRAVE_SEARCH_API_KEY for approved research. All paid flags remain false. Approve global/customer spending caps before activation. Live usefulness, provider availability and actual costs require controlled acceptance; no paid calls were made during development.


## Background service setup
Provision separate pluto_worker_runtime (member pluto_worker) and pluto_erasure_runtime (member pluto_erasure) logins only in the commercial database. Configure PLUTO_WORKER_DATABASE_URL for the worker/webhook and a separate Pluto BotFather token/signing secret. Never copy the personal bot. Optional account erasure requires PLUTO_ERASURE_DATABASE_URL, PLUTO_AUTH_ERASURE_KEY and explicit PLUTO_AUTH_ERASURE_ENABLED. Enable canonical billing reconciliation only with the separate tested Stripe configuration. Worker/provider flags remain OFF until acceptance. Exhausted Auth tickets require operator follow-up.


## Administrator setup
Use a separate commercial Auth identity, verify email and enroll MFA, then explicitly provision its UUID with the protected scripts/pluto-admin.ts command. Configure separate admin dashboard/API runtime logins, never a customer or billing login. Optional metrics API credentials are issued to a private file outside Git, expire after 30 days and can be revoked. PLUTO_ADMIN.md documents the future personal-JARVIS connection; personal code is unchanged. Operating-cost estimates begin NULL and require your real monthly inputs.


## Voice and customer experience acceptance
Choose whether to approve push-to-talk transcription costs after a measured beta test. PLUTO_VOICE_COST_APPROVED, voice/chat flags, active plan, sharing consent, provider keys and spending budgets all gate activation. No realtime service is enabled. Test real microphones, stop controls and local speech availability on chosen devices before allowing customers to use voice. Validate real email verification, onboarding, profile/module preferences and account recovery in the separate project.

