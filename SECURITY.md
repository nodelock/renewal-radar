# Security Policy

## Scope

Domain Renewal Radar handles domain names, renewal URLs, expiration dates, notification records, and server-side Telegram credentials. Treat all domain metadata as potentially sensitive.

## Deployment requirements

Use HTTPS in production. Store `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SESSION_SECRET`, and `SCHEDULED_TASK_SECRET` only in the deployment platform's server-side environment settings. Never prefix server-only credentials with `VITE_`, and never commit real values.

The scheduled endpoint requires `X-Scheduled-Secret`. Rotate this secret if a scheduler log, deployment output, or repository ever exposes it. Use a separate random value for `SESSION_SECRET`.

## Reporting a vulnerability

Please do not open a public issue for a suspected authentication bypass, secret exposure, cross-site scripting issue, or data access flaw. Contact the repository owner privately with reproduction steps, affected commit, and suggested mitigation. Remove real credentials and customer data from all reports.
