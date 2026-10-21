# Everyday workflows

## Dashboard

Use Dashboard at the top of the home screen to choose Default, Today or Custom. Default preserves the orbital module launcher. Today keeps JARVIS centered, moves modules into a compact bottom strip, and shows deadlines, tasks, today's schedule, spending, unread notifications and projects. Private summaries refresh while visible every minute. Dates use the saved workspace timezone, and spending keeps currencies separate. Today uses a dated header, three-entry schedule timeline, grouped task/deadline previews, compact inbox and a seven-day spending chart. It shows up to two tasks and two deadlines with links to full modules. The chart uses exact logged expenses, excludes transfers and keeps currencies separate; its selector defaults to the saved currency when available. Custom compact cards preview two records, with totals and links to the full module. Canvas completion remains unknown when the feed does not provide it.

Custom supports eight widget types, up to six grid spaces, optional centered JARVIS, drag ordering and equivalent up/down buttons. Without the central core, wide cards use two spaces and preview four records. Layout capacity is validated before saving. Choices persist to the account with stale-write protection; demo choices stay in the browser. The dashboard and page shell never scroll.

## Search and capture

Search / Add or Ctrl/Cmd+K searches across tracking modules (including connected Canvas projections). Notes include content and tags. Up to 40 results are returned; narrow the search for more specific results. Links open the matching record type and record, including when already inside that module. Quick capture creates an internal task or an Inbox note. Other record types retain their full module forms.

## Finances

Transfer / Reconcile opens the ledger tools. Transfers require two different accounts in the same currency and create an atomic matching pair. They affect account balances but are excluded from income, spending charts, budgets and spending alerts. Editing a transfer requires deleting the pair and creating its replacement. The delete confirmation identifies a paired transfer. Transaction deletion offers a ten-minute undo, restoring both sides when appropriate. Expired deletion snapshots are pruned during subsequent transaction deletions after one day.

Reconciliation compares the displayed all-entry ledger balance with an entered actual balance and records the exact difference as an income/expense adjustment. It rejects stale balances and never overwrites existing history. Recurring expenses have Record payment: after explicit confirmation, one due expense is posted and the next due date advances. This does not pay a bill or contact a bank. The existing Telegram logging and /undo behavior remain available.

## Education

Choose a course or View coursework to focus assignments, exams, grades and study sessions. Course focus survives record-tab changes. Grade calculator scenarios can be explicitly saved per course and reopened across devices; they do not alter saved grades. Canvas calendar-feed limitations remain visible: due dates are available, grades and submission state are not supplied. Existing saved grades are still manually editable.

## Calendar

Events month view combines events, open tasks and reminders, with an agenda alternative. Day details link back to the matching record. Calendar times use the workspace timezone. Overlap indicators compare timed events within the loaded month (up to 200 dated occurrences), not an unlimited calendar or inferred travel time.

New events may repeat daily, weekly or monthly for up to 52 occurrences. Saving materializes individually editable internal events in one transaction. Monthly generation clamps an original month-end anchor to valid dates. It does not create external calendar events or implement a continuously expanding series. Existing external events remain read-only.

## Notes and related records

The editor scrolls continuously and supports 32,000 characters of Markdown. Save note or Ctrl/Cmd+S updates the actual note. Valid changed drafts save a separate recovery copy after five seconds of inactivity; Save recovery draft also saves immediately. Recovery and Clear draft are explicit. Older drafts warn when based on an earlier saved version. Failed saves retain editor content. Version history retains the ten prior saved versions; restoring a revision places it into the editor for review before Save note.

Notes and tracking records expose Links for up to twelve existing related records. These are directional, owner-validated references. Removing a link does not remove a record. Existing typed relations (course, project, account, goal) still use their validated fields.

## Display and storage

Modules can scroll internally and offer 6/12/24/48 records per page; twelve is the UI default. The desktop minimum remains 1024 by 600. The assistant feature set is deferred; its existing arithmetic merely excludes new transfers. No new paid service, external provider authorization or API credential is needed.

The additive productivity migration adds owner-scoped WorkspaceState storage plus transfer/series metadata and ledger integrity triggers. Account export and encrypted backup include saved views, scenarios, drafts, revisions and undo snapshots. Older exports without WorkspaceState restore with an empty collection. Existing 16 MiB/5,000-row export limits still apply. Auth allowlisting and the single-owner deployment architecture remain unchanged.
