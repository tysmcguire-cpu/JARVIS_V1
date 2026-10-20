# Chase transaction sync setup

> Superseded by manual Telegram finance logging. Do not follow these activation steps for the current app. See FINANCE_LOGGING.md.

The read-only Plaid connector is implemented. The database migration is applied. No live Chase account has been connected or tested. Keep bank credentials and API secrets out of chat and Git.

## 1. Confirm free access first

Create a developer account at https://dashboard.plaid.com/ and request the free Trial with Transactions. Confirm your dashboard grants Production Trial access and Chase support before continuing. Availability depends on Plaid approval. Do not select a paid plan for this setup.

Plaid documents a Trial limit of 10 lifetime Production Items for eligible new US/Canada teams; deleting an Item does not restore a slot. One Chase connection can contain multiple accounts. The app reuses update mode when reconnecting. Its local counter cannot see Items created outside JARVIS. See https://plaid.com/docs/account/billing/.

The app requires your Trial confirmation, but cannot independently inspect your billing plan. Disconnect/revoke JARVIS before upgrading to any paid Plaid plan. Render's existing hosting bill is separate.

## 2. Configure Plaid and Render

In Plaid Dashboard, add this exact allowed OAuth redirect URI:

    https://jarvis-yfki.onrender.com/bank-link

Use JARVIS as your application display name and your Render address as its website. Copy the client ID and Production secret from Plaid Dashboard into Render → JARVIS service → Environment:

    PLAID_ENABLED=true
    PLAID_ENV=production
    PLAID_CLIENT_ID=<your client ID>
    PLAID_SECRET=<your Production secret>
    PLAID_TRIAL_CONFIRMED=true
    PLAID_REDIRECT_URI=https://jarvis-yfki.onrender.com/bank-link

Only set Trial confirmed after verifying the free Trial in your dashboard. Keep the existing JARVIS_CONNECTOR_ENCRYPTION_KEY unchanged; it encrypts provider credentials. Save and redeploy the newest commit. Leave Plaid disabled until these steps are complete. No extra worker service or paid AI API is required.

For developer testing only, sandbox uses PLAID_ENV=sandbox and Sandbox credentials. Sandbox transactions are synthetic, not your Chase history. Production requires HTTPS and the Trial gate.

## 3. Connect Chase yourself

Sign in to JARVIS. Open Settings → Integrations & CSV → Bank sync. In Options, select initial history and download frequency. Options apply on connection/reconnection; defaults request up to 730 days and download every six hours.

Return to Connect, review the consent, and click Connect / reconnect Chase. Complete Plaid Link and Chase's login/authorization yourself, selecting checking, savings or credit-card accounts. Return to JARVIS and wait for its verified connection confirmation.

Open Finances → Bank transactions. Initial historical processing may take several minutes. Manage shows connection state, download status and manual sync. The existing hosted worker checks unfinished history every five minutes, then follows your chosen interval. No scheduled bank reads occur while disabled, disconnected or paused after a failed revocation.

## What appears

Transaction date, description/merchant, signed exact amount, account mask, pending/posted state, authorized date and provider category/confidence when supplied. Pending transactions are replaced by their posted versions; modifications and removals are reconciled. Selected-account balances are cached values returned during sync. Missing information is labeled unavailable.

Amounts going out display negative; amounts coming in display positive. Refunds and transfers are not automatically classified as income or expenses. Bank history remains separate from your manual ledger, budgets and notification rules to avoid double counting. This downloads transaction history, not PDF statements, and cannot move money.

Plaid's bank updates are periodic, typically one to four times daily, so a new purchase may not appear immediately. Requesting 730 days does not guarantee Chase supplies that much. A manual download retrieves currently available data; it does not invoke a paid on-demand refresh. See https://plaid.com/docs/api/products/transactions/.

## Controls and recovery

Manage → Disconnect and revoke removes the Plaid Item. If revocation fails, automatic downloads are paused and the credential is retained so you can retry. Do not delete the Plaid account or encryption key first. App-data deletion and snapshot replacement require revocation first.

Exports exclude all access tokens and sync cursors. Restored providers are disconnected. The existing snapshot limit is 5,000 rows per table and 16 MiB; large transaction histories may require an owner-controlled native database backup. The sync service bounds each response to 2 MiB and a complete delta to 20 pages/10,000 changes; excessive or failed batches leave the previous snapshot and cursor intact.

Connection access is independently owner-checked, encrypted at rest, and restricted to Chase. Only Transactions is requested; no Auth, Transfer, Identity, statement or paid refresh products are enabled. Live acceptance still requires you to connect Chase and confirm a transaction against your bank app.
