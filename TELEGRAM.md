# Telegram — Phase 3

Implementation is ready; live activation is not verified until the owner supplies a bot token, explicitly selects their IDs, pairs the chat, and tests a real command. This computer is the primary local workspace. No public hosting or tunnel is required for local polling. Telegram remains disabled by default.

## Local setup

1. Open the official [@BotFather](https://t.me/BotFather) in Telegram. Send `/newbot`, follow its prompts, and put the issued token in the local ignored `.env` as `TELEGRAM_BOT_TOKEN`. Never paste it in chat or Git. Keep `TELEGRAM_ENABLED=false` during identification.
2. Stop other polling processes for this bot. Run `pnpm telegram:identify`. It prints a random identification marker and an exact follow-up command. Send the printed `/start MARKER` to your own bot in a **private** Telegram chat, then run the printed follow-up command. The helper returns only IDs from private messages matching that marker. It does not select an owner, acknowledge updates, pair a chat or access the database. It refuses an existing webhook rather than removing it.
3. Put the matching numeric IDs into `TELEGRAM_OWNER_USER_ID` and `TELEGRAM_OWNER_CHAT_ID`. Set `TELEGRAM_ENABLED=true`. Preserve the existing JARVIS_OWNER_ID and all Supabase values. Restart `pnpm dev` after editing environment values.
4. Sign into JARVIS and open **Settings → Telegram → Create pairing code**. This cancels old pending replies and requires pairing again. Send the displayed `/start CODE` to your own bot within 10 minutes. The database stores only its SHA-256 hash, and successful pairing consumes it once.
5. In a separate terminal at the repository folder, run `pnpm telegram:poll`. Keep it running while using Telegram. The successful `/start CODE` response confirms pairing; the earlier identification marker is not a pairing code. Use `/help` and `/status`, then create a clearly labeled test note and use `/undo` to remove it. Verify the note in the signed-in website as well.
6. **Refresh status** shows pairing and queued/paused reply counts. **Disconnect** clears pairing and cancels pending replies. A new code is required to reconnect. If delivery exhausted ten attempts, **Retry paused replies** requeues them; the local worker must be running.

Polling works while this computer and the polling process are running. It is independent of an open browser, but is not a hosted service or a Phase 6 notification scheduler. Ctrl+C stops polling (an outstanding long poll may take up to 40 seconds to end). Do not run polling and a webhook concurrently.

## Commands

Use `|` between fields; fields themselves cannot contain that separator. Use explicit calendar dates; reminder times are interpreted in the workspace timezone when later notification scheduling is implemented. Financial amounts use the chosen account's two-decimal currency. Account/category/task titles must identify exactly one existing owner record; otherwise the bot asks for clarification and saves nothing.

```text
/start PAIRING_CODE
/help
/status
/task Synthetic task | 2026-10-20 | high
/remind Synthetic task | 2026-10-20 | 10:00
/note Synthetic note | Clearly labeled test content | testing
/idea Synthetic project idea | Clearly labeled test details
/expense 12.34 | Exact account title | Exact expense category | Description | 2026-10-15
/income 25.00 | Exact account title | Exact income category | Description | 2026-10-15
/tasks search text
/notes search text
/projects search text
/balance
/undo
```

Searches return the latest five matching records. Balance totals are separated by currency and reflect manually recorded information, not a bank connection. Ideas are notes tagged `project-idea`. Reminders are stored but not delivered automatically. Free-form questions, AI analysis and weekly review content remain Phase 5/6. Unsupported text asks for a deterministic command instead of guessing.

Undo removes the latest unchanged Telegram-created Transaction, Task, Reminder or Note within 24 hours. It refuses records edited afterward or blocked by child records. Duplicate updates cannot repeat writes or undo. Undo itself is not recursively reversible.

## Security and delivery

- Both approved Telegram user ID and private chat ID must match server configuration before any database access. Group, forwarded, inline-bot, bot-sender, edited and non-text updates are ignored. No first-message owner assignment exists.
- Verified owner pairing is required for all private commands. Website pairing, disconnect, retry and status actions independently verify the Supabase owner.
- Domain mutation, audit entry and unique bot/update ID are committed in one owner-scoped transaction. A per-owner database advisory lock serializes concurrent commands; crashes before commit roll everything back. Transaction-local identity and RLS protect both Telegram state and domain records.
- Incoming message text is not stored. Bounded replies and minimal undo metadata are stored under owner RLS; they may contain private record excerpts. Retention/export/deletion policy remains Phase 6.
- Replies are an outbox with leases, retry delays and up to ten automatic attempts. A provider `retry_after` is honored. A network failure after Telegram accepted a reply can produce a duplicate reply because sendMessage has no application idempotency key; domain writes remain deduplicated.
- Disconnect cancels queued replies. A reply already in flight may still arrive at the same approved owner chat. A changed ID/bot allowlist prevents stale queued replies from being sent to a different identity.
- Commands are capped at 60 accepted updates per minute for the owner. Webhooks bound request bodies to 32 KiB and validate a constant-time secret comparison before processing. Bot tokens and private provider errors are never logged.
- Replies use plain text, content protection and disabled link previews. Bot chats are not end-to-end encrypted.

## Optional future webhook mode

`POST /api/telegram/webhook` is implemented, independently authenticated and disabled without Telegram configuration plus a valid `TELEGRAM_WEBHOOK_SECRET`. Only this exact endpoint bypasses browser-session proxy checks. It requires JSON and the `X-Telegram-Bot-Api-Secret-Token` header. Supply a cryptographically random 32–256 character secret using letters, digits, `_` and `-`.

Registering a real webhook requires a reachable HTTPS endpoint and explicit hosting/setup authorization. No webhook, public URL or tunnel was created by this build. When registering, use the exact path above, the secret_token parameter, message-only updates, and low max_connections. Telegram retries non-2xx responses; the route reports pending retryable replies with 503. `pnpm telegram:replies` can run the durable reply worker without fetching updates. Do not start `telegram:poll` while a webhook exists. Notification scheduling remains Phase 6.

Official references: [Bot creation FAQ](https://core.telegram.org/bots/faq), [Telegram Bot API](https://core.telegram.org/bots/api), [webhook guidance](https://core.telegram.org/bots/webhooks).

## Database and verification

The `20261016010000_telegram` migration adds TelegramIdentity and TelegramMessage, forced owner RLS, unique per-owner/bot/update IDs, indexes and validation constraints. `pnpm db:telegram` grants CRUD only on these state tables to the existing restricted runtime role. Neither step contacts Telegram or changes credentials.

`pnpm db:verify-telegram` exercises state CRUD and isolation in a rolled-back transaction and refuses to replace an existing pairing. For an already-paired environment, preserve that state and use the automated tests instead. Unit tests run the real command processor against PostgreSQL with a restricted role and mock outbound delivery. Live bot pairing, real message delivery, cross-website visibility and real retry/restart verification remain the final activation checks.
