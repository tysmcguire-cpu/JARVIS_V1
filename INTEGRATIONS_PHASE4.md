# Phase 4: sources and CSV imports

Current owner override: Gmail and Google Drive are no longer offered in Settings or new authorization. Calendar connections are optional: Google Calendar, Apple Calendar (iCloud), or both, with separate selected resources and credentials. See CALENDAR_CONNECTIONS.md for private Apple discovery/read-only sync and limits. No calendar has been connected during implementation. The original Phase 4 provider table below is historical; its Gmail/Drive rows are retired UI options retained only in legacy adapter/snapshot compatibility code.

Open Settings → Integrations and CSV. Synthetic provider previews run entirely in memory, without contacting accounts or saving owner records. The live schema and runtime permissions are configured, but no real provider is connected and no bank file was imported during implementation. Telegram continues running independently.

## Financial CSV workflow

1. Create the destination account and needed expense/income categories in Finances. Imports add to its existing ledger without adjusting its opening balance or connecting a bank.
2. Select a file, account and the category for each relevant transaction type. Search choices by title when necessary. Selected choices survive later searches.
3. Map date, description and amount columns, plus optional type, currency and bank transaction ID columns. Choose date and amount meanings explicitly.
4. Review every page, destination account, totals and duplicate warnings. Preview stores a validated, owner-bound draft for 30 minutes; it creates no transactions.
5. Acknowledge possible duplicates and choose Import reviewed transactions. New transactions, source receipts, counts and audit commit together. Retry the same confirmation safely after an interrupted response.

Limits: comma-delimited CSV, unique headers, 32 columns, 200 transactions and 256 KiB. Quoted commas, escaped quotes, CRLF, multiline fields and UTF-8 BOM are supported. Descriptions fit 200 characters. Malformed rows and zero amounts block the entire preview. Dates are explicitly YYYY-MM-DD, MM/DD/YYYY or DD/MM/YYYY. Amounts use a decimal point and at most two decimals; quoted standard thousands commas are supported. Signed mode means negative expenses and positive income. Explicit type mode accepts expense/debit or income/credit with nonnegative amounts. Positive-only files can declare expense or income. Any currency column must match the selected account. There is no currency conversion or date guessing.

One expense and one income category apply to a batch; edit individual imported transactions afterward if needed. Imported rows appear in Finances → Transactions and manual balances, including Telegram /balance.

### Duplicate and retention rules

- Renamed or differently quoted files with the same normalized data, account and category mapping share a batch digest. A completed batch cannot create transactions again.
- Mapped bank IDs identify transactions within the destination account. Overlapping files skip known IDs. Reusing an ID with changed source content requires manual resolution; duplicate IDs within a file are rejected.
- Without IDs, automatic identity is limited to the same normalized file and row position. Edited, reordered or overlapping files can contain duplicates. Exact date/description/amount/type matches and identical no-ID rows require review; legitimate identical payments are preserved separately.
- Confirmation rechecks ownership, currency, category types, receipts and new duplicate conditions. Duplicates appearing since preview require a fresh review, even if earlier warnings were acknowledged.
- Receipts survive transaction editing or deletion, so reimporting known source rows does not silently recreate them. Transactions remain editable and deletable.
- Going back from review discards an uncommitted draft. Expired drafts are removed on later preview requests. Imported plans/provenance are retained. Broader retention/export policy remains Phase 6.

## Authorization and key custody

Before storing real credentials, explicitly choose account/resource scope and key custody/backup, such as an owner-controlled password manager. Set JARVIS_CONNECTOR_ENCRYPTION_KEY in the ignored local .env to 32 cryptographically random bytes encoded as 64 hex characters, then restart the app. This build leaves it blank and does not choose a custody service. CSV works without it. Do not paste keys or provider tokens in chat.

Back up the key before storing credentials. Losing it makes encrypted credentials unrecoverable; replacing it does not rotate existing envelopes automatically. Keep the same key when restoring the database or switching computers.

Access/refresh tokens and Google client secrets use AES-256-GCM with fresh 96-bit nonces and authenticated owner/connection/provider context. Health responses exclude credentials. Credential fields clear after save; existing secrets are never sent back for editing.

After key setup, select Authorize, enter an existing legitimately obtained token and expiry, select resources, and approve read-only access. Explicitly nonexpiring tokens are supported for GitHub/Canvas. Google refresh requires its approved refresh token and OAuth client ID/secret. Saving stores an encrypted local grant without contacting the provider; Sync now performs the reads. The app does not implement a new OAuth consent redirect flow: obtain Google tokens through an approved registered OAuth project first and satisfy applicable provider verification requirements.

| Provider | Approved selection and access | Adapter behavior |
| --- | --- | --- |
| Google Calendar | One calendar ID; calendar.events.readonly | Events, pagination, incremental sync tokens and deletion tombstones; recurring events are not expanded |
| Gmail | Up to 20 selected Gmail API message IDs; gmail.metadata | Subject/from/date metadata only; no mailbox listing, bodies, attachments or sending |
| GitHub | Up to 20 owner/repository names; fine-grained Metadata: Read | Repository metadata only; no Git writes, code downloads, issue mutation or Projects boards |
| Canvas LMS | Approved HTTPS Instructure origin and up to 20 course IDs; institution-authorized GET assignments | Paginated selected-course assignment snapshots; custom domains need separate allowlist review |
| Google Drive | Up to 20 selected file IDs; drive.metadata.readonly | Metadata/description and trash state; no file bodies, listing or modification |

The adapter enforces selected IDs, though an OAuth scope can authorize broader metadata. Use approved least-privilege grants. No source is fetched on page load or credential save. Source authorization is separate from the repository's Git login.

Official permission and endpoint references: [Calendar](https://developers.google.com/workspace/calendar/api/v3/reference/events/list), [Gmail reads](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get) and [scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes), [GitHub](https://docs.github.com/en/rest/repos/repos#get-a-repository), [Canvas](https://developerdocs.instructure.com/services/canvas/resources/assignments), [Drive](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/get), [Google token refresh](https://developers.google.com/identity/protocols/oauth2/web-server#offline).

## Sync and source review

Synced data is a read-only source snapshot, separate from manually edited tracking records. Review records provides pagination, plain-text details, source links and source/fetch timestamps. Gmail's source time is its received time; other adapters use supplied update timestamps. Missing titles are labeled as missing. Source text is never executed as HTML/code.

The engine supports refresh, bounded pagination, normalization, source-ID upserts, cursor checkpoints, health, backoff and local disconnect. It saves refreshed credentials before reads and advances a cursor only after all pages are staged. Renewable connection leases prevent overlapping or disconnected workers from persisting results. Failed runs preserve safely staged pages for idempotent retry.

Calendar uses provider sync tokens. Gmail/Drive/GitHub recheck selected resources and skip older metadata using source-time cursors. Canvas rechecks full selected-course snapshots and reconciles absent IDs only after every page succeeds. Unavailable resources that return errors retain their prior snapshot with error status rather than claiming a successful empty result.

Limits: 100 pages/run, 100 records/page, 2 MiB JSON responses, 15-second request timeouts, 500-character cursors and renewable 120-second leases. Source requests use GET with redirects refused. Google's authorized token refresh is the only POST. Canvas pagination must stay within the approved origin/course. Sync is owner-initiated, with no autonomous scheduler or external record writes.

Reset source cursor clears the staged snapshot before the next explicit full sync, including recovery from expired Calendar tokens. Disconnect locally stops future reads and deletes encrypted local credentials. Provider-side revocation is a separate owner action. An in-flight request may finish, but invalidated leases prevent its results from being stored.

## Storage and verification

ApiConnection, SyncLog, ExternalRecord, CsvImportBatch and CsvImportKey have compound owner links, uniqueness, validation constraints, indexes and forced RLS. Transaction gains optional CSV provenance. Browser roles have no direct access. Runtime grants are configured with pnpm db:integrations. The live verification command, pnpm db:verify-integrations, rolls back all synthetic fixtures and contacts no provider.

Tests run the actual CSV repository and live sync controller against PostgreSQL with a restricted role and mocked HTTP. Browser tests use isolated synthetic data. Real account access and a user-selected bank file still need explicit owner setup and verification; they are not claimed tested live.

Current Canvas connection uses an encrypted private Calendar Feed URL instead of asking the TAMU owner for an API token. Read-only dated assignments/events, manual or optional scheduled refresh, and existing assignment reminders are described in CANVAS_FEED.md. Imported snapshots remain separate from manual records; grades and completion status are unavailable. The historical Canvas API notes below/above apply only to separately institution-approved API access.
