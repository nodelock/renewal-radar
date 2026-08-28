import { createApiApp } from "../../server/_core/api-app.js";

let appPromise: ReturnType<typeof createApiApp> | undefined;

/**
 * Explicit entry for GitHub OAuth. Keeping this route as a concrete Vercel
 * function avoids relying on dynamic catch-all matching for the callback.
 * Routes through the Vite-free api-app.
 */
export default async function handler(req: any, res: any) {
  appPromise ??= createApiApp();
  const app = await appPromise;
  return app(req, res);
}
