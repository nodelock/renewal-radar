# Deployment

Repository: https://github.com/nodelock/renewal-radar

## PostgreSQL

Create a PostgreSQL database with Neon or Supabase and copy its pooled connection string into the deployment platform as `DATABASE_URL`. The schema is PostgreSQL-specific and does not require a vendor-specific extension. Apply the SQL in `drizzle/migrations/0000_foamy_sir_ram.sql` with the provider SQL editor or `pnpm drizzle-kit migrate` from a trusted environment.

## Vercel

Import the repository, set the project build command to `pnpm build`, and add the server-side variables `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SESSION_SECRET`, and `SCHEDULED_TASK_SECRET`. The included `vercel.json` schedules `/api/scheduled/check-expiry` daily. The endpoint accepts GET and POST and supports either `Authorization: Bearer $CRON_SECRET` or `X-Scheduled-Secret: $SCHEDULED_TASK_SECRET`. Vercel Cron can use its built-in `CRON_SECRET` authorization convention; other runners should send the custom header.

## Netlify

Import the repository and configure the build command and publish directory from `netlify.toml`. Add the same server-side variables. The included schedule describes the daily trigger. Netlify deployments should forward the scheduled invocation to `/api/scheduled/check-expiry` with `X-Scheduled-Secret` set from the site's environment. Do not make the scheduled endpoint public without the secret.

## GitHub Actions alternative

GitHub Actions can call the endpoint once a day from a private repository. Store `APP_URL` and `SCHEDULED_TASK_SECRET` as Actions secrets. Use a repository-level `workflow_dispatch` button for manual testing. Do not put customer domains, Telegram tokens, or database data in repository files.

## Post-deployment verification

1. Open the public homepage and complete sign-in.
2. Add a test domain with an HTTPS renewal URL.
3. Call the scheduled endpoint from a secure runner and confirm a `job_runs` row is written.
4. Confirm the notification log prevents a second message for the same domain, type, and expiry date.
5. Remove the test asset and rotate any temporary credentials.
