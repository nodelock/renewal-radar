# Renewal Radar

Repository: https://github.com/nodelock/renewal-radar

Renewal Radar is an open-source domain asset control room for keeping renewal dates, registrar links, notes, and Telegram reminders in one calm workspace.

> Track renewals before they become incidents.

## Status

This repository is an original implementation inspired by the general problem of fragmented domain renewal management. It does not copy the reference worker's authentication, storage, UI, or code structure. The project is released under the MIT License with author attribution in the repository history and project metadata.

The application includes a public product page, GitHub OAuth sign-in, a responsive dashboard, PostgreSQL domain storage, protected reminder scanning, and Telegram notification workflow.

## Stack

- React + TypeScript + Tailwind CSS
- Express + tRPC for typed server procedures
- PostgreSQL through Drizzle ORM, compatible with Neon and Supabase
- GitHub OAuth authorization-code login with signed HttpOnly sessions
- Telegram Bot API for reminders
- Vercel and Netlify deployment configurations

## Environment variables

Copy `env.example` into your deployment platform settings. Never commit real values.

- `DATABASE_URL`: PostgreSQL connection string from Neon or Supabase.
- `GITHUB_CLIENT_ID`: GitHub OAuth App client ID.
- `GITHUB_CLIENT_SECRET`: server-only GitHub OAuth App secret.
- `VITE_GITHUB_CLIENT_ID`: public GitHub OAuth App client ID used by the browser.
- `TELEGRAM_BOT_TOKEN`: server-only Telegram bot token.
- `TELEGRAM_CHAT_ID`: destination chat ID.
- `SESSION_SECRET`: a long random secret used by the signed session layer.
- `SCHEDULED_TASK_SECRET`: secret for authenticated external scheduler calls.
- `VITE_REPO_URL`: public repository URL used by the homepage links.

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

For local GitHub OAuth, create a separate OAuth App and use this callback URL:

```text
http://localhost:3000/api/oauth/callback
```

## Deployment

Import the GitHub repository into Vercel or Netlify, set the required environment variables, provision a PostgreSQL database, apply the migration in `drizzle/migrations`, and configure the platform's daily scheduled callback to the documented server endpoint. The Vercel adapter is `api/index.ts`; the public frontend is built to `dist/public`.

For the current Vercel project, configure the GitHub OAuth App with:

```text
Homepage URL:
https://renewal-radar-three.vercel.app

Authorization callback URL:
https://renewal-radar-three.vercel.app/api/oauth/callback
```

The scheduled handler must be authenticated, idempotent, and independent of any browser session.

## Security

See `SECURITY.md` for reporting guidance. Production credentials belong only in deployment secrets. Renewal URLs are restricted to HTTPS and all state-changing procedures must validate authenticated ownership and request origin.

## Contributing

See `CONTRIBUTING.md` and `AI_MAINTENANCE.md` before opening a pull request. Changes should include tests, preserve the PostgreSQL schema contract, and avoid introducing hardcoded customer data, credentials, or fake testimonials.
