# Pluto — what you need to provide

The commercial build is isolated on feature/pluto-saas-v1. Personal JARVIS remains unchanged. Local checks do not establish public launch readiness. No commercial deployment, real migration, purchase or charged provider request has been made. Enter secrets only in the separate project/host environment, never chat or Git.

## Start here: closed beta
1. Approve a separate Supabase project and separate Render service. Never reuse the personal database/service. Budget roughly $7/month for a limited beta with available Supabase Free; a production starting budget is $32/month ($7 host +$25 Supabase Pro), before optional email/domain and usage costs. See PLUTO_COST_MODEL.md for assumptions.
2. Provide the commercial project reference, Auth URL/publishable key and independently generated restricted database logins through the commercial environment. Follow PLUTO_DEPLOYMENT.md; migration/admin credentials stay local and are removed after approved setup. No database password needs to be sent in chat.
3. Configure verified-email Auth, custom SMTP, sender identity and exact site/callback/reset URLs. Test email receipt and password recovery. Supply the approved HTTPS site URL and beta email allowlist, maximum 100 people. Signup stays OFF until this is tested.
4. Choose a separate administrator account, verify its email and enroll MFA. Explicitly provision its Auth UUID using the documented guarded command. An admin cannot also be a customer profile. Optional aggregate API keys expire after 30 days; personal JARVIS integration is documented but personal code has not been changed.

## Optional capabilities: enable separately
5. Stripe TEST account/key/webhook secret and Plus/Pro prices. Monthly defaults are $9.99/$19.99; decide annual totals before configuring annual prices. Test checkout, Portal, failed invoices, refunds, replay and cancellation before live approval. Business verification/tax settings remain yours to complete.
6. A NEW Telegram bot token and webhook secret. Keep your personal bot untouched. Test pairing and commands using two beta customers before enabling background processing.
7. Separate OpenAI API billing/key if AI is wanted. ChatGPT Plus does not include API spending. Approve a maximum monthly global budget and provider-side cap first. Research additionally needs a Brave API key. Tracking works without these services.
8. Decide whether to enable push-to-talk voice after measuring quality/cost. It is OFF and needs explicit cost approval plus paid entitlement, sharing consent and microphone testing. No paid realtime voice is enabled.
9. Optional commercial Google/Apple calendar, Canvas and GitHub configuration/approvals. Access remains read-only. Gmail/Drive and automatic bank sync are not offered. Generate connector encryption keys privately and back them up securely.
10. Approve Auth erasure worker configuration and recovery/key custody. Test deletion, export and exhausted-job follow-up before customer use.

## Before selling publicly
11. Obtain trademark clearance for the provisional Pluto name and qualified review of draft terms/privacy, business contact details, jurisdiction, taxes, refunds/cancellation and retention. Draft pages are not final legal documents.
12. Arrange independent security review. One unresolved development-only braces advisory has no published patched release; production audit is clean, but this remains a review item. Local tests do not replace an independent audit.
13. Execute real two-customer/admin hosted acceptance, Stripe test acceptance, email/recovery, bot, microphone and provider shutdown checks. Load-test the actual host with approved synthetic traffic; no 10,000-user capacity claim has been established.
14. Drill backup restore into a disposable separate project; record recovery time/data loss and approved RTO/RPO. The local embedded restore test is not a hosted disaster-recovery drill.
15. Approve expenses, commercial deployment and staged activation. Public startup requires explicit branding/legal/security/recovery/expense attestations; live billing needs additional approval. Keep all approval fields false until the corresponding work is actually completed.

Decisions still needed: annual pricing, legal/business jurisdiction and taxes, final name/domain, email sender, monthly AI budget, beta participants, retention approval, voice activation and recovery objectives. No purchases or public activation will happen automatically.

If a GitHub token previously pasted into chat is still active, revoke it in GitHub and replace it locally. Do not reuse it for commercial services.