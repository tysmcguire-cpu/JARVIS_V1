# Grounded assistant — Phase 5

Open Assistant after signing in. Select a domain, inclusive date window (maximum 366 days), optional title filter and Summary or Conflicts, then Analyze records. Local mode treats the question as a history label and uses the explicit filters. It is a deterministic analysis tool, not a natural-language chatbot. The synthetic demo makes no request and reads no owner data.

Each response paginates facts/calculations, supporting sources and coverage limits. Source references include record/module, source update time and retrieval time. Saved answers are historical snapshots, not live views. Re-run analysis for current records. History is paginated and individual conversations can be deleted with their source references. Security audit events retain only action/outcome/time, not conversation contents.

## Supported analysis

- Finances: recorded income, expenses and net by currency and date/title filter; exact PostgreSQL sums and BigInt formatting. No currency conversion or bank balance inference.
- Education: recorded assignment/exam deadlines and status; no inferred GPA or study-effort estimate.
- Calendar: tasks/events and optional overlap calculation using manual event wall-clock intervals. Recurrence, travel time, imported events and DST instant disambiguation are excluded.
- Career, projects and goals: selected metadata, milestones/activity, recorded goal progress and habit entries. Percentages describe recorded current/target, not a prediction.
- Notes: titles/tags only, not full contents. Sources: selected live imported titles with original update/retrieval/connection health; not whole external accounts.
- Weekly: an on-demand combined review of recorded financial activity, education, schedule, career, projects and goals. Automatic scheduling/delivery remains Phase 6.
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

Each interpreted request also requires the owner to check the question-sharing consent box. Only the question is sent to OpenAI, along with static tool instructions/schema; personal record contents, stored history, source titles and credentials are not sent. The question itself may contain personal details: inspect it before consenting. The model can return only one validated `query_records` selection: title substring and summary/conflict view. Domain, dates and recommendation permission stay under the owner's explicit control. Answers are computed/rendered locally, so model prose cannot invent financial totals or citations. The owner sees the resulting query through source coverage. This implementation does not provide multi-turn natural-language reasoning, model-authored recommendations or general knowledge answers.

Requests use `store:false`, no previous response ID, a 20-second timeout, 600 output-token limit, a fixed HTTPS endpoint, no redirects and no retries. Storage disabling does not itself guarantee zero provider retention; review [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) for your project. An API error is shown without tokens/provider response bodies. The website reserves a durable limit of 20 requests per owner per hour, including failed attempts and deleted conversations. This is a request guard, not a billing cap; set provider project budgets too.

## Telegram

The approved paired private chat can use `/ask projects | 2026-10-01 | 2026-10-31 | optional title search`. Domains match the website, including `weekly`. This uses local tools only, saves the complete response in Assistant history and returns the first two claims with source/freshness and a coverage notice. Duplicate Telegram updates do not duplicate history. Invalid domains/dates ask for corrected fields. No OpenAI call or unrequested recommendation occurs. Existing Telegram owner/chat allowlists and rate guard still apply; bot messages are not end-to-end encrypted.

## Storage and checks

`AiConversation` stores the bounded query and answer snapshot; `AiSourceReference` stores owner-bound references. Compound ownership FKs, RLS, browser-role revocation and explicit owner predicates apply. Each server action authenticates independently; repository transactions independently reauthenticate. Internal data tools accept only static allowlisted domains/columns and bound query parameters. Record text is displayed as plain React text and cannot become SQL, code, URLs or tool instructions. Source links use fixed internal module routes.

For an approved local database: `pnpm db:migrate`, `pnpm db:assistant`, `pnpm db:verify-assistant`. The verification script rolls back synthetic conversation/source checks and does not call AI. Runtime uses the restricted login; migration/admin credentials remain separate. On Windows, stop app/polling processes before `pnpm db:generate`, then restart them. No external provider integration or notification deployment is activated by this phase.
