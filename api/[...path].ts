import { createApiApp } from "../server/_core/api-app.js";

let appPromise: ReturnType<typeof createApiApp> | undefined;

/**
 * Vercel invokes this catch-all function for every nested /api/* route.
 * The root api/index.ts only matches /api itself, so OAuth and tRPC need this entry.
 * Routes through the Vite-free api-app to avoid Vercel's per-function compiler
 * resolving the Vite -> Rollup -> @tailwindcss/oxide native chain.
 */
export default async function handler(req: any, res: any) {
  appPromise ??= createApiApp();
  const app = await appPromise;
  return app(req, res);
}
