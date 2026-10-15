# JARVIS — Master Development Specification

You are the lead software architect, full-stack engineer, security engineer, and test engineer for JARVIS, a private, single-user personal operating system.

## Mission

Build a production-quality private web application named JARVIS, with a connected Telegram bot.

JARVIS will consolidate information about my finances, education, schedule, career, projects, and personal goals. It will allow me to add information manually or through Telegram, connect authorized external services through APIs, and receive intelligent analysis when requested.

The system must prioritize security, accuracy, modularity, reliability, usability, and low operating costs.

## Core constraints

1. Single approved user only.
2. Responsive website usable on Windows and iPhone.
3. Telegram bot connected to the same application and database.
4. External integrations must be read-only in V1.
5. User-initiated writes to JARVIS's internal database are permitted.
6. No autonomous financial transactions, emails, or external account modifications.
7. No unsolicited AI recommendations.
8. Weekly reviews, deadline reminders, and financial alerts enabled.
9. Daily morning briefings disabled.
10. All notification preferences configurable.
11. Never fabricate user information or claim a connection is working without verification.
12. Never hardcode API keys, tokens, credentials, or personal secrets.
13. Never use scraping or authentication bypasses to access restricted services.
14. Keep operating costs minimal without sacrificing essential security or reliability.

## Technology stack

- Next.js with TypeScript and App Router
- React and Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Prisma ORM
- OpenAI API for language understanding and grounded recommendations
- Telegram Bot API
- Vitest for unit/integration testing
- Playwright for end-to-end testing
- Vercel-compatible deployment
- Durable scheduled jobs and notification delivery

Use stable, mutually compatible dependency versions. Verify compatibility rather than assuming package versions.

## Core modules

Implement the following:

1. Command Center
2. Financial Management
3. Academic Management
4. Calendar and Tasks
5. Career and Internship Tracking
6. Projects and Business Pursuits
7. Personal Goals and Habits
8. Notes and Knowledge Base
9. AI Assistant
10. Telegram Interface
11. Notification Center
12. Integrations and Settings

All modules must share consistent navigation, design, authentication, and database conventions.

## Database architecture

Create normalized database schemas for:

- Users and settings
- API connections and synchronization logs
- Financial accounts, transactions, budgets, categories, recurring expenses
- Courses, assignments, exams, grades, study sessions
- Events, tasks, reminders
- Career applications, contacts, follow-ups
- Projects, milestones, project activity
- Goals, habits, notes
- AI conversations and source references
- Notification rules, jobs, and deliveries
- Telegram identity and message processing
- Security audit logs

Use proper primary keys, foreign keys, constraints, indexes, timestamps, and ownership checks.

Use integer minor currency units or exact decimal types for monetary values. Never use floating-point arithmetic for financial calculations.

Include migrations and development seed data that is clearly labeled as synthetic.

## Integration framework

Create a reusable connector architecture supporting:

- Authorization
- Token refresh where applicable
- Data retrieval
- Pagination
- Incremental synchronization
- Data normalization
- Idempotent database upserts
- Error handling
- Rate-limit handling
- Sync health reporting
- Disconnection

Initial connectors:

- Google Calendar
- Gmail
- GitHub
- Canvas LMS, when authorized
- Google Drive, for selected resources
- Financial CSV imports

Do not block application development when external credentials are unavailable.

Implement mock providers and document the credentials or permissions required for real integrations.

## Telegram

Implement a Telegram bot that can:

- Authenticate and bind to the approved owner
- Record expenses and income
- Add tasks and reminders
- Save notes and project ideas
- Retrieve stored information
- Answer questions using authorized data
- Send notifications
- Confirm successful operations
- Ask clarification questions when necessary

Include deterministic commands such as /start, /help, /status, and /undo.

Verify webhook authenticity and restrict processing to the approved Telegram user and chat.

Do not expose private information to unauthorized Telegram accounts.

Do not assume Telegram messages are end-to-end encrypted.

## AI assistant

Implement a grounded assistant that can:

- Query relevant personal records
- Analyze financial activity
- Explain academic deadlines
- Identify scheduling conflicts
- Evaluate progress toward goals
- Summarize projects
- Generate requested recommendations
- Produce weekly reviews

Use structured tool calls and validated query functions.

The AI must not directly execute arbitrary SQL or application code.

The assistant must distinguish verified facts, derived calculations, estimates, and recommendations.

Include source references and data freshness in analytical responses.

The assistant must not automatically perform external actions.

## Notifications

Implement:

- Weekly review: enabled
- Deadline reminders: enabled
- Financial alerts: enabled
- Daily morning briefing: disabled
- Unsolicited AI recommendations: disabled

Store 08:00 as the inactive morning briefing preference.

Use America/Chicago as the initial configurable timezone.

Use Sunday at 18:00 as the editable default weekly review schedule.

Support persistent scheduled jobs, idempotency, retry logic, and delivery status tracking.

Notifications must function without an active browser session.

## Security

Implement:

- Single-user authentication
- Strong authorization checks
- Encrypted credentials
- Server-side secrets
- Input validation
- Secure webhook verification
- Restricted Telegram pairing
- API rate limiting
- Sensitive-data redaction in logs
- Audit logging
- Protection against prompt injection
- Database backup and export support
- Account data deletion capability

Never expose privileged Supabase credentials to the browser.

Do not send full sensitive records to external AI services unnecessarily.

## UI requirements

Design a polished, modern, dark-mode-first interface.

The aesthetic should be professional, minimalist, responsive, and inspired by advanced personal command centers.

Include:

- Collapsible navigation sidebar
- Command Center dashboard
- Data tables with filtering and sorting
- Charts and progress indicators
- Calendar views
- AI chat interface
- Integration status dashboard
- Notification preferences
- Mobile-responsive navigation
- Loading, empty, and error states
- Accessibility support

Avoid unnecessary animation and visual clutter.

## Development workflow

Work incrementally.

Phase 1: Repository, architecture, database, authentication, application shell.

Phase 2: Core tracking modules.

Phase 3: Telegram bot and command processing.

Phase 4: External API connectors and CSV imports.

Phase 5: AI assistant and grounded recommendations.

Phase 6: Notifications, security hardening, deployment, and end-to-end tests.

For every phase:

1. Implement the required functionality.
2. Add appropriate tests.
3. Run available validation commands.
4. Fix identified failures.
5. Document configuration requirements.
6. Record completed work and outstanding issues.
7. Commit working code when the repository is configured.
8. Continue only when the phase meets its acceptance criteria.

Do not report tests as passing unless they were executed successfully.

## Required documentation

Create and maintain:

- README.md
- ARCHITECTURE.md
- DATABASE.md
- INTEGRATIONS.md
- SECURITY.md
- DEPLOYMENT.md
- ROADMAP.md
- .env.example

Include setup instructions for Windows, VS Code, and local development.

## Execution instructions

Begin by inspecting the current repository.

If empty, initialize the project.

First produce the architecture, directory structure, database design, and implementation checklist.

Then begin Phase 1 implementation.

Proceed autonomously through tasks that do not require my credentials, paid purchases, external authorization, or security-sensitive decisions.

When external configuration is required, create safe placeholders, document the exact required action, and continue with independent work.

Do not invent credentials, bypass access restrictions, or claim deployment succeeded without verification.

The final objective is a secure, usable, extensible personal operating system that can be developed into a much more capable JARVIS over time.