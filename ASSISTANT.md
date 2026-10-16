# Grounded assistant — Phase 5

Open Assistant after signing in. Select a domain, inclusive date window (maximum 366 days), optional title filter and Summary or Conflicts, then Analyze records. Local mode treats the question as a history label and uses the explicit filters. It is a deterministic analysis tool, not a natural-language chatbot. The synthetic demo makes no request and reads no owner data.

Each response paginates facts/calculations, supporting sources and coverage limits. Source references include record/module, source update time and retrieval time. Saved answers are historical snapshots, not live views. Re-run analysis for current records. History is paginated and individual conversations can be deleted with their source references. Security audit events retain only action/outcome/time, not conversation contents.

## Supported analysis

- Finances: recorded income, expenses and net by currency and date/title filter; exact PostgreSQL sums and BigInt formatting. No currency conversion or bank balance inference.
- Education: recorded assignment/exam deadlines and status; no inferred GPA or study-effort estimate.
- Calendar: tasks/events and optional overlap calculation using manual event wall-clock intervals. Recurrence, travel time, imported events and DST instant disambiguation are excluded.
- Career, projects and goals: selected metadata, milestones/activity, recorded goal progress and habit entries. Percentages describe recorded current/target, not a prediction.
- Notes: titles/tags only, not full contents. Sources: selected live imported titles with original update/retrieval/connection health; not whole external accounts.
- Weekly: an on-demand combined review of recorded financial activity, education, schedule, career, projects and goals. Phase 6 adds optional scheduling; see NOTIFICATIONS.md.
- Recommendations: only with the explicit checkbox. These are conservative local rules (e.g. reserve time before a recorded unfinished deadline), labelled recommendations and linked to supporting records. They do not modify any records or infer available time. No estimates are fabricated.

Title matching is case-insensitive literal substring search. Dated entities use the selected date range. Undated career/habit/note metadata is not date-filtered. Each record type returns at most 20 rows; a response retains at most 100 sources. Coverage describes truncation and omissions. Narrow filters for more complete domain-specific answers. No matches means unknown activity, not zero real-world activity. Stored imported source titles are not date-filtered; disconnected/deleted/mock sources are excluded. Sources can later change or be removed; historical answers remain until their conversation is deleted.

## Optional OpenAI interpretation

The app uses the [Responses API function-calling format](https://developers.openai.com/api/docs/guides/function-calling). No OpenAI SDK dependency is needed. Configure the ignored local `.env`:

```
JARVIS_AI_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=
```

Keep disabled until you deliberately approve API billing, select an available model supporting strict function calling in your API project, and save a project-scoped key locally. Never paste keys into chat or Git. Set the flag to true and restart the server after configuration. No model is silently selected and no paid API validation is performed during development.

There are three modes. Local analysis shares nothing with OpenAI. Question interpretation requires the question-sharing consent box and sends the question plus static tool instructions/schema; the model selects a validated title substring and summary/conflict view. Domain, dates and recommendation permission stay under the owner's control. Optional grounded composition additionally requires explicit consent to send the first 20 bounded local factual summaries and source/coverage metadata. Full notes, stored conversation history and credentials are never included, but summaries and the question can contain personal information: review the consent before proceeding.

Composition uses a second strict structured-output request. The model selects immutable local fact indices and can add labelled estimates or explicitly requested recommendations with validated retrieved source IDs. It cannot rewrite the original facts or their numeric totals, invent source links, change records or invoke arbitrary tools. Invalid indices/citations are rejected. Model analysis remains fallible and should be checked against its sources. This is bounded single-request analysis, not a general multi-turn assistant.

Requests use `store:false`, no previous response ID, a 20-second timeout per call, a fixed HTTPS endpoint, no redirects and no retries. Interpretation permits 600 output tokens; optional composition permits 1,800 and makes at most two provider calls per analysis. Storage disabling does not itself guarantee zero provider retention; review [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) for your project. An API error is shown without tokens/provider response bodies. The website reserves a durable limit of 20 analyses per owner per hour, including failed attempts and deleted conversations. This is a request guard, not a billing cap; set provider project budgets too. Live OpenAI acceptance remains pending owner configuration; development made no paid calls.

## Telegram

The approved paired private chat can use `/ask projects | 2026-10-01 | 2026-10-31 | optional title search`. Domains match the website, including `weekly`. This uses local tools only, saves the complete response in Assistant history and returns the first two claims with source/freshness and a coverage notice. Duplicate Telegram updates do not duplicate history. Invalid domains/dates ask for corrected fields. No OpenAI call or unrequested recommendation occurs. Existing Telegram owner/chat allowlists and rate guard still apply; bot messages are not end-to-end encrypted.

## Storage and checks

`AiConversation` stores the bounded query and answer snapshot; `AiSourceReference` stores owner-bound references. Compound ownership FKs, RLS, browser-role revocation and explicit owner predicates apply. Each server action authenticates independently; repository transactions independently reauthenticate. Internal data tools accept only static allowlisted domains/columns and bound query parameters. Record text is displayed as plain React text and cannot become SQL, code, URLs or tool instructions. Source links use fixed internal module routes.

For an approved local database: `pnpm db:migrate`, `pnpm db:assistant`, `pnpm db:verify-assistant`. The verification script rolls back synthetic conversation/source checks and does not call AI. Runtime uses the restricted login; migration/admin credentials remain separate. On Windows, stop app/polling processes before `pnpm db:generate`, then restart them. No external provider integration or notification deployment is activated by this phase.
