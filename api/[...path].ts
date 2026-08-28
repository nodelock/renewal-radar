import { createApp } from "../server/_core/index.js";

let appPromise: ReturnType<typeof createApp> | undefined;

/**
 * Vercel invokes this catch-all function for every nested /api/* route.
 * The root api/index.ts only matches /api itself, so OAuth and tRPC need this entry.
 */
export default async function handler(req: any, res: any) {
  appPromise ??= createApp({ serveFrontend: false });
  const app = await appPromise;
  return app(req, res);
}
