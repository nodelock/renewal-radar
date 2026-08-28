import { createApiApp } from "../server/_core/api-app.js";

let appPromise: ReturnType<typeof createApiApp> | undefined;

/**
 * Single Vercel serverless function for the entire /api namespace.
 *
 * A CONCRETE filename (server.ts) is used deliberately (not a bracket catch-all
 * like [...path].ts) because concrete api/ functions are the only ones Vercel
 * reliably deploys in this Vite + outputDirectory build. Incoming /api/* paths
 * are forwarded here by a vercel.json rewrite, and Vercel preserves the
 * original request URL (req.url) so the Express api-app can still route
 * /api/trpc, /api/oauth, /api/storage and /api/scheduled correctly.
 */
export default async function handler(req: any, res: any) {
  appPromise ??= createApiApp();
  const app = await appPromise;
  return app(req, res);
}
