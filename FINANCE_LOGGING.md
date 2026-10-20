# Finance logging

Finances now uses your own logged entries instead of automatic bank downloads.

## Telegram

Use the same paired private bot:

- +400 adds income of 400 in the selected account's currency.
- -20 food records an expense of 20 in Food.
- -20 food lunch records Food as the category and lunch as the description.
- +400 salary uses an income category called Salary.
- -20 food | Checking chooses an account by its exact name.
- /balance shows recorded account balances, separated by currency.
- /undo removes your latest unchanged Telegram-created record within 24 hours.

Each quick entry is dated in your workspace timezone. The bot confirms the amount, category, account and updated balance. No AI interpretation or bank API is used.

If you have one account, quick entries use it. If there are no accounts, the first successful quick entry creates Personal with a zero opening balance in your workspace currency. Set its starting amount once in Finances → Accounts if you want a balance that includes money you already had. If you have multiple accounts, the bot asks you to add | Exact account name. It never guesses between accounts.

The first word after the amount is the category; remaining words are the description. Missing income labels use Income; missing expense labels use Uncategorized. New categories are created for the corresponding income/expense type. Duplicate category/account names need clarification instead of an arbitrary match. Amounts must be positive magnitudes with at most two decimal places; the leading sign determines the direction. Zero and malformed amounts are rejected.

Existing /income and /expense commands remain available for explicit account/category/date input. No external money moves. Re-delivery of the same Telegram update cannot create a second entry. Sending a second separate identical message intentionally logs another transaction. Undo removes only the transaction, keeping account/category organization intact.

## Website

The default Finance screen shows transactions on the left, with spending by category and daily spending charts on the right. Select the month and currency above the log. Search filters the log and both spending charts. Turning a log page does not change the charts: they use all matching entries in that month. Category slices show the five largest categories and a combined remainder; bar heights use daily expenses, including zero-spending days.

Income increases the recorded balance but is excluded from spending charts. Currency totals are never combined or converted. The Balance figure includes opening balances and all logged transactions in the selected currency, regardless of the displayed month/search. Income and Spent figures use the selected month/search. These are your recorded amounts, not live bank balances or statements.

Transactions can still be added, edited and deleted on the website. Accounts, categories, budgets and recurring expenses remain in the Finance tabs. The visible Finance module reloads stored data every 30 seconds, pausing during dialogs or other work; Reload is immediate. Telegram entries also participate in existing manual-ledger budget/notification calculations according to your saved preferences.

## Bank integration retirement

The hosted worker no longer imports or runs the bank download job. New bank setup and bank-history navigation are removed. If an old Plaid connection exists, Settings → Integrations and CSV exposes Previous bank connection solely for explicit revocation. Credentials and historical source records are preserved until that action; no provider is contacted automatically by this change. No new credentials, migration, paid service or AI subscription is required.

## Interface cleanup

Module titles and operational controls remain. Repeated private-workspace banners, phase labels, AI/promotional slogans, decorative frame borders and redundant helper paragraphs are removed. Demo data retains a concise identifying label. Form inputs, error messages, source provenance, authorization consent and data-deletion confirmation remain functional.
