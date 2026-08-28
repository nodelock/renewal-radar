# Environment configuration

Repository: https://github.com/nodelock/renewal-radar

The managed preview environment exposes a built-in `DATABASE_URL` for its own database service. That service is not the PostgreSQL target for production. For a public deployment, set `DATABASE_URL` in Vercel or Netlify to the pooled PostgreSQL connection string from Neon or Supabase, preferably with SSL enabled.

The application reads `SESSION_SECRET` before the template fallback `JWT_SECRET`. Use a unique random value of at least 32 bytes. `SCHEDULED_TASK_SECRET` is a separate random value used only by the external daily scheduler when it calls `/api/scheduled/check-expiry`.

`VITE_REPO_URL` may contain the public GitHub repository URL used by the homepage Fork/Star links. The current default is `https://github.com/nodelock/renewal-radar`; override it only when maintaining a fork.

`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are server-only. They must not be used in client-side modules, exposed through tRPC responses, or stored in the repository. Use platform environment settings and rotate them if exposed.
