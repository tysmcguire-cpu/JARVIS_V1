# Notifications

The hosted scheduler is active on the existing paid Render instance. The owner verified a real scheduled Telegram reminder with the browser closed. No extra worker service is required. `corepack pnpm hosted:start` supervises the website, notification scans and webhook reply retries; local polling stays stopped.

## Customize in the app

Open Notifications → Schedules and alerts. Use the Notification settings dropdown to jump between ten pages, or Back/Continue. Save notification preferences applies changes; Reload preferences discards unsaved edits. A stale settings form must be reloaded before saving. Your preferences are stored in the owner database, not this browser.

| Notification | Controls |
| --- | --- |
| Reviews | Enable, workspace timezone, time, selected weekdays, repeat every 1–12 weeks, optional cycle start date, Telegram switch |
| Deadline alerts | Enable, 0–30-day lead window, daily start time, selected record types, once/daily/every 1–168 hours, Telegram switch |
| Financial alerts | Enable, exact monthly expense threshold and currency, start time, once per month/daily/every 1–168 hours while above threshold, Telegram switch |
| Briefings | Enable, time, selected weekdays, repeat every 1–12 weeks, optional cycle start date, Telegram switch |
| Stored task reminders | Independent enable, once/daily/every 1–168 hours, Telegram switch; edit each reminder's first date/time in Calendar or with /remind |

Reviews always summarize seven calendar days, regardless of delivery frequency. Briefings summarize the scheduled day. Select all seven weekdays for daily reviews/briefings, or just the days you want. Multiweek cycles use Sunday-based calendar weeks anchored to the optional start date, otherwise the rule's original activation week; an explicit future start date postpones delivery until that date.

Enabled types always create an in-app entry. Telegram requires both the global permission in Delivery controls and that type's own Telegram switch. Turning a type off pauses it entirely. Existing weekly/day/time preferences are preserved as defaults; morning briefing remains off. A blank expense threshold leaves that alert unconfigured. No currency conversion or bank access is inferred.

Deadline alerts repeat only inside the chosen lead window, at or after the configured daily time, and stop when completed or past due. Stored reminders have independent controls and repeat until the linked task is completed; daily repeats use the original reminder time. One-time reminders catch up at most seven days. Source edits can create a new record version eligible for a fresh alert. Canceling a queued occurrence does not turn off future repeats; disable its type to pause all future occurrences.

Intervals use workspace wall-clock hours, anchored to the start of the deadline lead window, the reminder's original date/time, or the first day of the expense month at the selected time. Spring DST gaps advance calendar schedules to the next real minute; repeated fall hours share a key. Due work is checked approximately every 30 seconds. This is not an exact-second delivery guarantee.

## Persistence, security and recovery

Only changed rules get a new version; their pending jobs are canceled. Unrelated schedules and queued work are preserved. Saving unchanged preferences does not reset schedules. Previously generated unchanged one-time reminders are not replayed merely because Telegram is enabled or another setting is saved. Default upgrade settings are materialized without changing their meaning.

Database locks, owner-bound rule versions, unique occurrence keys, expiry, five-attempt Telegram retry budgets, rate-aware delays and fenced leases protect repeated ticks, restarts and overlapping deploys. Source completion/edits, financial threshold reductions and changed preferences are checked before delivery. Pending ledger entries after a crash can have an unknown outcome. A crash after Telegram accepts a message can still duplicate a delivery; use its notification ID to recognize duplicates.

Repositories independently authenticate the sole owner, and all tables have forced RLS and browser-role revocation. Configurations are strict server-validated JSON. No model call or unsolicited recommendation is made by schedules. Analysis and candidate coverage remain bounded; deadline/reminder scans examine at most 200 candidates per type, and review catch-up is limited to seven days. Historical sources and limitations remain in Assistant history.

The additive frequency migration adds rule config and an indexed source lookup; it does not replace data or alter owner preferences. Snapshots include rule configuration, validate its schema, and accept older snapshots with missing config as legacy defaults. Restore cancels old delivery work and requires explicit administrative approval; see RECOVERY.md.
