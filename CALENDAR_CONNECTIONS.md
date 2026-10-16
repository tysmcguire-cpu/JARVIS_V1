# Optional calendar connections

Owner preference: Google Calendar and Apple Calendar (iCloud) are independent optional connections. Connect neither, either one, or both in Settings → Integrations and CSV. No calendar was authorized, discovered or synced during implementation. Gmail and Google Drive are removed from the visible integration list and new authorization choices. GitHub, Canvas and CSV remain available.

## Google Calendar, when wanted

Use the existing Authorize flow with your legitimately obtained Calendar access/refresh credentials and one selected calendar ID. Scope is `calendar.events.readonly`. Google token refresh needs the matching approved OAuth project/client. This app does not currently provide a new Google OAuth redirect flow. Save the selected grant, then explicitly choose Sync now. Source reads do not edit Google events. Recurring series are retained as snapshots without instance expansion.

## Apple Calendar (iCloud), when wanted

1. Keep a recovery copy of JARVIS_CONNECTOR_ENCRYPTION_KEY before storing provider credentials.
2. At account.apple.com, create an app-specific password for JARVIS. Apple requires two-factor authentication. Never supply your main Apple Account password, and do not make your calendar public.
3. Choose Authorize for Apple Calendar (iCloud). Enter the Apple Account email and app-specific password. Explicitly approve listing calendar names, then Find iCloud calendars. Discovery reads calendar metadata only and does not save credentials or read event bodies.
4. Select up to 20 event calendars, review the read-only permission and save. Calendar names are paginated five at a time. Your email and app-specific password are encrypted with the owner/connection/provider context, not stored in the resource selection or returned in status responses.
5. Choose Sync now only when ready to read those calendars. Source review includes fetched/source timestamps, raw local date/time with timezone labels and recurrence coverage. Revoking/changing the app-specific password requires explicit reauthorization. Disconnect locally removes the stored credential and stops future reads; revoke the password separately in your Apple Account if desired.

This connects calendars stored in iCloud, not calendars stored only on a phone or computer. If a Google-hosted calendar is merely displayed in Apple's Calendar app, use the Google connection for that source. Connecting both providers preserves separate provenance; matching or mirrored events are not automatically merged.

## Read-only behavior and limits

Apple uses authenticated CalDAV PROPFIND and REPORT reads. No PUT, DELETE, PROPPATCH, invitations, external edits, mail reads or contact reads are implemented. An app-specific password may grant broader account access than JARVIS uses; the application restricts itself to calendar discovery and explicitly selected event collections.

Requests are restricted to HTTPS caldav.icloud.com and numbered iCloud CalDAV hosts, with no arbitrary host/port/query credentials. Selected event requests cannot leave their calendar collection. Redirects are revalidated before credentials are forwarded. XML declarations/entities that could resolve external content are rejected; no event attachments, alarms or external links are fetched. Responses are bounded to 2 MiB, collections to 5,000 objects, selected syncs to 10,000 objects and batches to 100. The generic 100-page budget still applies. Discovery is owner-authenticated and limited to 20 attempts per hour, including failed attempts; audit stores operation metadata only.

Sync performs a bounded full snapshot of selected iCloud VEVENT objects. Deleted/absent sources are reconciled only after the complete selected snapshot succeeds. An incomplete or denied response cannot claim a healthy empty calendar or erase the previous snapshot. Valid UTC LAST-MODIFIED or DTSTAMP is required; missing source timestamps fail explicitly rather than inventing update times. All-day and floating/timezone-labelled dates remain distinguishable. Recurring masters and exception counts are retained, but recurrence instances and exception timelines are not expanded. Oversized or malformed events fail the sync and leave a redacted error status.

Imported events remain read-only source snapshots, separate from manually edited JARVIS tracking records. Sync is owner-initiated; there is no automatic calendar synchronization scheduler or two-way editing. The hosted notification scheduler is a separate feature. No additional paid service is required for this connector.

## Validation and acceptance

Synthetic tests cover CalDAV discovery, consent/authentication/rate guards, selected resources, redirects and collection confinement, XML entity/size rejection, event normalization and timezone/recurrence limits, pagination, encrypted credentials, independent Google/Apple connections and empty-snapshot reconciliation. Browser checks verify the four-provider integration list and minimum desktop layout. Live Apple/Google account acceptance remains pending the owner's future decision to connect.

References: [Apple app-specific passwords](https://support.apple.com/en-us/102654), [CalDAV standard](https://www.rfc-editor.org/rfc/rfc4791), [Google Calendar event reads](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).
