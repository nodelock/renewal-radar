# Production OAuth callback finding

Checked on 2026-08-28:

- The production homepage at `https://renewal-radar-three.vercel.app/` serves successfully.
- The production OAuth callback URL returns Vercel `404: NOT_FOUND`, including when opened with the user-provided OAuth query string.
- The GitHub `main` branch currently contains both `api/index.ts` and `api/[...path].ts`. The latest commit shown for the `api` directory is `Fix GitHub OAuth callback routing on Vercel` (`0def91b`).
- This confirms the catch-all file was pushed to GitHub, but does not prove that the Vercel project is deploying that repository, branch, or root directory.
- Vercel's official NOT_FOUND guidance recommends checking the URL, deployment existence, deployment logs, and permissions: https://vercel.com/docs/errors/not_found
- Vercel project configuration documentation states that configuration and routing depend on the deployed project configuration; the next verification must inspect Vercel Project Settings for the connected repository, production branch, and Root Directory.
