# Environment configuration

Repository: https://github.com/nodelock/renewal-radar

Renewal Radar keeps credentials outside the repository. Use Vercel or Netlify environment settings, or a local `.env.local` file excluded by `.gitignore`. Never commit real values.

## Private single-owner deployment

The application is configured for a private installation: only the GitHub account whose numeric ID matches `GITHUB_ALLOWED_USER_ID` can complete sign-in. Every other GitHub account is rejected before a user record or session is created.

Configure this compact set of variables for a Vercel Production deployment:

| Variable | Required | Exposure | Purpose |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Server-only | PostgreSQL connection string from Neon or Supabase. Use SSL when supported, for example `?sslmode=require`. |
| `VITE_GITHUB_CLIENT_ID` | Yes | Public | GitHub OAuth App client ID used by the browser and server. This value is intentionally public. |
| `GITHUB_CLIENT_SECRET` | Yes | Server-only | GitHub OAuth App client secret used for the authorization-code exchange. |
| `GITHUB_ALLOWED_USER_ID` | Yes | Server-only | Your immutable numeric GitHub user ID. This is the login allowlist. |
| `SESSION_SECRET` | Yes | Server-only | Long random value used to sign HttpOnly session cookies. |
| `CRON_SECRET` | Yes for Vercel Cron | Server-only | Long random value used to protect the scheduled expiry scan. |
| `SCHEDULED_TASK_SECRET` | External scheduler only | Server-only | Optional compatibility secret for GitHub Actions or another scheduler. |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts | Server-only | Telegram Bot API token created by BotFather. |
| `TELEGRAM_CHAT_ID` | Telegram alerts | Server-only | Destination chat for renewal reminders. |
| `VITE_REPO_URL` | Recommended | Public | Repository link shown on the homepage: `https://github.com/nodelock/renewal-radar`. |

`VITE_GITHUB_CLIENT_ID` and `VITE_REPO_URL` are public configuration values. `VITE_REPO_URL` is optional because the application has a repository URL fallback. Never mark the client secret, database URL, session secret, scheduler secret, or Telegram token with a `VITE_` prefix.

The old duplicate `GITHUB_CLIENT_ID` variable is not required by the current configuration. Use only `VITE_GITHUB_CLIENT_ID` for the client ID. Do not create `VITE_GITHUB_CLIENT_SECRET`. For a minimal deployment, omit `SCHEDULED_TASK_SECRET` when using Vercel Cron and omit the Telegram variables if reminders are not enabled.

## Finding the allowed GitHub user ID

Set `GITHUB_ALLOWED_USER_ID` to the numeric `id` belonging to your own GitHub account. Do not use a username, display name, or email address because those values can change or may be unavailable. If the variable is empty or does not match the authenticated GitHub profile, the callback intentionally returns an authorization error.

## GitHub OAuth callback

For the current Vercel deployment, configure the GitHub OAuth App with:

```text
Homepage URL:
https://renewal-radar-three.vercel.app

Authorization callback URL:
https://renewal-radar-three.vercel.app/api/oauth/callback
```

The callback URL must match the deployed hostname and path exactly.

## Local development

Use a separate GitHub OAuth App for local development and set its callback URL to:

```text
http://localhost:3000/api/oauth/callback
```

Use a separate development database and Telegram chat whenever possible. Production and preview environments should not share credentials or user data.
