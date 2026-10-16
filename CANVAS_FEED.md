# Canvas calendar feed

## Connect when ready

1. Wait for the latest Render deployment to show Live, then refresh JARVIS.
2. In your signed-in Canvas account, open Calendar, then Calendar Feed in its sidebar. Copy the private HTTPS iCal link. Do not paste it into chat or publish it.
3. In JARVIS open Settings → Integrations and CSV → Connections. In Canvas LMS's Actions menu choose Authorize.
4. Paste the feed link, choose Manual only, Every 15 minutes, Every hour, or Every 6 hours, then approve read-only access and save.
5. Choose Sync now for the initial import; Review records shows imported items, due timestamps and source details. Automatic refresh, if selected, also performs the first import without needing an open browser.

The default is Manual only. Automatic refresh is separate from notification frequency. Reauthorize with the link to change refresh frequency; this replaces the old snapshot. Disconnect locally removes the stored credential and stops further imports and pending Canvas deadline delivery. To revoke the link itself, use Canvas's available feed-reset controls or school support; local disconnect does not revoke it at Canvas.

## Scope and limits

This reads Canvas's calendar export directly without a Microsoft password, API token, Google Calendar connection or Apple Calendar connection. It imports dated assignments and calendar events into read-only integration source records, separate from manual Education/Calendar tracking. The review table shows raw UTC timestamps (or an all-day date). It does not import grades, scores, feedback, submission/completion status, files, announcements, undated assignments or To Do items. It does not write to Canvas. Existing Canvas API adapters remain available internally for separately institution-approved accounts; the current owner-facing setup uses the feed.

Canvas documents an export window of 30 days in the past through 366 days in the future, with at most 1000 items. The importer accepts UTC timed events (including Canvas's TZID=UTC encoding) and date-only all-day events, with source DTSTAMP/LAST-MODIFIED required. Other timezones fail explicitly rather than guessing. Recurrence rules are retained but instances are not expanded. A complete successful snapshot marks absent records deleted; omission may mean an item left the export window, not that the course assignment was deleted. Malformed, oversized or failed responses retain the previous snapshot and show an error.

Imported assignment deadlines participate in existing enabled Assignment notifications, using your configured timezone, lead days, delivery time and repeat frequency. Calendar events do not become assignment alerts. The feed does not reveal submission status, so these alerts can still remind you about already-submitted work. Turn off Assignment reminders when unwanted. Pending delivery rechecks the connection, source timestamp, due date and deletion status; disconnect, error state or removed/changed records prevent stale delivery. No extra reminder channel or unsolicited AI recommendation is enabled.

## Security and operation

The private feed link is a bearer credential. JARVIS encrypts it with the existing server connector key; public connection selection, cursors, record source links and logs exclude it. Keep that key backed up separately. Owner authentication is independently checked by web actions/repositories. Background execution takes its owner identity only from the server allowlist, checks that the owner exists and is nonsynthetic, and uses transaction-local owner RLS. Existing connection leases protect sync writes.

Allowed destinations are HTTPS canvas.tamu.edu and single-level *.instructure.com hosts, using only /feeds/calendars/user_*.ics routes. No redirects, URL credentials, custom ports, queries, fragments, encoded traversal, external attachments or embedded remote resources are followed. Requests are GET-only, no account password/header, no-store, bounded to 15 seconds, 2 MiB and 1000 events. Full feed validation precedes persistence. Provider auth, rate limit and parse errors are redacted; scheduled errors back off before retry.

The existing hosted:start supervisor runs feed scheduling with the existing background child when JARVIS_OWNER_ID is configured, independently of Telegram/notification enablement. It scans for explicitly opted-in due feeds every 30 seconds, honors successful last sync, retry time and active leases, and uses the existing single Render service. No new paid service, environment variable, database migration or dependency is needed. Feed refresh is a polling interval, not a guarantee of instant Canvas publication.

## Verification

174 unit/database tests and 15 integration browser scenarios passed, including encrypted link storage, due-only scheduled refresh, successful empty snapshot reconciliation, failed snapshot retention, disconnect, owner-scoped storage, UTC/date-only parsing, pagination, network restrictions, notification timezone conversion and pending-delivery invalidation. Minimum 1024×600 authorization screenshot reviewed. Production validation is recorded in IMPLEMENTATION_PLAN.md. Only synthetic fetch responses were used; no private Canvas link has been received or contacted and no account is connected by this change. Real TAMU feed acceptance remains an owner setup step.

References: [Canvas feed documentation](https://community.instructure.com/en/kb/articles/662804-how-do-i-view-the-calendar-ical-feed-to-subscribe-to-an-external-calendar), [TAMU API access policy](https://lms.tamu.edu/support-resources/canvas-api-access-token-request.html), [Canvas feed implementation](https://github.com/instructure/canvas-lms/blob/master/app/models/calendar_event.rb).
