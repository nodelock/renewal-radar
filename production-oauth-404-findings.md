# Production OAuth callback finding

Checked on 2026-08-28:

- `https://renewal-radar-three.vercel.app/` serves the Renewal Radar homepage successfully.
- `https://renewal-radar-three.vercel.app/api/oauth/callback` returns Vercel `404: NOT_FOUND` even without OAuth query parameters.
- Expected behavior from the Express callback handler would be a controlled `400` response for missing `code` and `state`, so Vercel is not routing this path to the serverless function.
- This is a deployment routing/entrypoint issue, not a GitHub username allowlist rejection. The allowlist is reached only after the callback route is invoked.
