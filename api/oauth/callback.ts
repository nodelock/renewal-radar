import { createApp } from "../../server/_core/index.js";

let appPromise: ReturnType<typeof createApp> | undefined;

/**
 * Explicit entry for GitHub OAuth. Keeping this route as a concrete Vercel
 * function avoids relying on dynamic catch-all matching for the callback.
 */
export default async function handler(req: any, res: any) {
  appPromise ??= createApp({ serveFrontend: false });
  const app = await appPromise;
  return app(req, res);
}
