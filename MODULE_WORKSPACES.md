# Module workspace design

Updated October 19, 2026. The seven core tracking modules now use dedicated presentations while retaining owner authentication, RLS, concurrency checks and the existing forms.

- Finances: manual account cards show exact current ledger balances with opening balances identified separately. The ledger prioritizes date, description, amount, account and category; expense amounts are marked as outflows using the stored category kind. Budgets show their periods, budget limits retain recorded spending summaries, and recurring expenses prioritize next due dates. Connected bank history stays separate to prevent double counting.
- Education: course cards show code, term and instructor. Assignments/exams prioritize due date, course and actual status. Canvas feed omissions remain unavailable; past Canvas deadlines are not falsely classified as incomplete. Grade rows show earned/possible points and percentages; study sessions summarize recorded minutes. Recorded points are unweighted, not a GPA or an official course grade.
- Calendar: monthly view remains the default, with actual titles/times and paginated day detail. Records view prioritizes event time/location, task priority/status and reminder time. Tasks and reminders retain their own dated lists.
- Career: a three-lane pipeline groups the six actual application statuses into Explore, In progress and Outcomes. Stage badges retain the original status. The board shows only the current four-item page; filters, pagination and total matching metrics remain available. Contacts and follow-ups have their own columns. No external applications or messages are sent.
- Projects: project briefs, status and due dates appear as cards. Milestones use dated project-linked rows, and activity is a dated timeline. No fabricated percentage of project completion is shown.
- Goals: each card shows actual current/target quantities, units and a bounded progress indicator. Reaching a target is separate from manually marking a goal done. Habits show daily targets and their linked goal; logs show individual dated values. No streak or adherence rate is invented from incomplete logs or mixed units.
- Notes: a paginated index and reader show titles, tags and content. Long content is divided by both character count and line breaks, preserving all text without panel scrolling. Search matches titles; tags are displayed rather than claimed to be a global tag filter. The Table toggle retains compact record editing.

All modules share navigation, accessibility controls and visual conventions. Each has its own accent, purpose statement, columns and relevant summaries. A Table/Workspace toggle preserves tabular access. Dashboard, Assistant, Notifications and Settings retain their existing dedicated workflows; the Settings bank connection guidance now points to Bank sync.

## Metrics and limits

Counts, statuses, upcoming/past-due dates, study minutes, points, reached targets and tag counts are calculated over the complete matching query, not just the visible page. Dates use the configured workspace timezone. Calendar results remain bounded to 200 dated occurrences and record pages to four. Finance account-balance/spending summaries and Education recorded-points summaries retain their documented whole-ledger/whole-gradebook scope. Currency balances stay separate and money arithmetic uses integer minor units.

The pipeline is a paginated view, not a full-board export. Bank history does not automatically affect manual budgets or alerts. Canvas calendar feeds do not contain current grades or reliable submission/completion status. No new provider, billing service, schema migration or credentials are required by this UI update.

## Verification

Browser checks cover every record tab/form at 1024×600, the module-specific default views, long-note reading, four cards in one pipeline stage, and full four-card pages with visible titles and controls. Database checks cover every entity in a single round trip, empty data, complete filtered totals across pages, workspace dates, exact account balances and transaction category direction. Existing notification tests now explicitly anchor their historical weekly scheduler fixture rather than depending on the host clock.

## Readability and appearance — October 19, 2026

Finances now defaults to the combined ledger/charts/budget overview; Transactions is a full-width list. Assignments use six-row pages, show the total and visible range, and support direct page selection. All stored assignments remain reachable; the Canvas calendar feed still controls source coverage and does not supply undated/unexported work. Due dates and local times appear on separate lines, with full source details available.

Shared labels, tables, controls, notes and module text are larger, with short-screen layouts adjusted to keep all controls inside one viewport. Settings → Appearance provides primary and secondary hex/color pickers, a preview, Save palette and Reset colors. Signed-in palettes persist in owner settings and are loaded on other devices at their next page load. Synthetic demo palettes use a separate /demo cookie. Palette inputs accept only six-digit hex colors; neutral text/backgrounds and semantic status colors remain readable. The original animated core, dashboard accents, navigation and spending charts use the chosen palette.

Background choices: Settings → Appearance now offers Current, Black and White. Current preserves the existing navy appearance and remains the default. White adapts panels, text, forms and charts for a light background; Black uses a black workspace with dark panels. Your primary/secondary accents still apply. Save palette saves the background to your account as well, so other devices use it on their next load. Reset colors resets only accent colors, preserving the selected background. The center JARVIS lettering uses a bolder, slanted condensed type stack with a primary/secondary gradient; no external font request is required.

Reference lettering follow-up: the center wordmark now uses custom thin geometric J.A.R.V.I.S lettering modeled on the owner's supplied image, replacing the slanted system font. Ambient glow and lettering share the core's exact center, with centered scaling/opacity animation instead of positional drift.

Third color: Appearance now includes a Third color picker/hex field for shared text, icons, borders, controls and other legacy blue details. Primary/secondary still control deliberate accent highlights and charts; semantic warning/success colors stay distinct. Detail tones derive from the third color with lighter/darker shades, and white-mode text retains neutral contrast. Blue base shades in the appearance/dashboard overrides were made neutral to avoid residual fixed-blue tints. The center JARVIS wordmark is restored to the original thin, upright, widely spaced system lettering; centered glow and motion controls remain.
