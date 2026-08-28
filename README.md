# Domain Renewal Radar

Repository: https://github.com/nodelock/renewal-radar

Domain Renewal Radar is an open-source domain asset control room for keeping renewal dates, registrar links, notes, and Telegram reminders in one calm workspace.

> Track renewals before they become incidents.

## Status

This repository is an original implementation inspired by the general problem of fragmented domain renewal management. It does not copy the reference worker's authentication, storage, UI, or code structure. The project is released under the MIT License with author attribution in the repository history and project metadata.

The current preview contains the public product page, secure sign-in entry, and responsive dashboard experience shell. The PostgreSQL model and production reminder workflow are being completed behind the same public engineering boundary.

## Planned production stack

- React + TypeScript + Tailwind CSS
- Express + tRPC for typed server procedures
- PostgreSQL through Drizzle ORM, compatible with Neon and Supabase
- Telegram Bot API for reminders
- Platform-managed scheduled HTTP callback for daily scanning
- Vercel and Netlify deployment configurations

## Environment variables

Copy `.env.example` to your deployment platform settings. Never commit real values.

- `DATABASE_URL`: PostgreSQL connection string from Neon or Supabase.
- `TELEGRAM_BOT_TOKEN`: server-only Telegram bot token.
- `TELEGRAM_CHAT_ID`: destination chat ID.
- `SESSION_SECRET`: a long random secret used by the application session layer.
- The existing Manus authentication variables are provided by the managed project template for the preview environment.

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

## Deployment

Import the GitHub repository into Vercel or Netlify, set the required environment variables, provision a PostgreSQL database, apply the migration in `drizzle/migrations`, and configure the platform's daily scheduled callback to the documented server endpoint. The scheduled handler must be authenticated, idempotent, and independent of any browser session.

## Security

See `SECURITY.md` for reporting guidance. Production credentials belong only in deployment secrets. Renewal URLs are restricted to HTTPS and all state-changing procedures must validate authenticated ownership and request origin.

## Contributing

See `CONTRIBUTING.md` and `AI_MAINTENANCE.md` before opening a pull request. Changes should include tests, preserve the PostgreSQL schema contract, and avoid introducing hardcoded customer data, credentials, or fake testimonials.
