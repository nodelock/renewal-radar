import { createApiApp } from "../server/_core/api-app.js";

let appPromise: ReturnType<typeof createApiApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ??= createApiApp();
  const app = await appPromise;
  return app(req, res);
}
