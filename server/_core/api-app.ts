import express from "express";

// Vercel-safe Express app builder. This file intentionally does NOT import
// Vite / frontend build tooling, so Vercel's per-function compiler never
// resolves the Vite -> Rollup -> @tailwindcss/oxide native chain.
type ExpressRequest = any;
type ExpressResponse = any;
type ExpressNext = any;
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { registerStorageProxy } from "./storageProxy.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { runExpiryCheck } from "../domain-service.js";

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: ExpressRequest, res: ExpressResponse, next: ExpressNext) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (hits.size > 10_000) {
    for (const [storedKey, stored] of Array.from(hits.entries())) {
      if (stored.resetAt < now) hits.delete(storedKey);
    }
  }

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + 60_000 });
  } else if (++entry.count > 120) {
    return res.status(429).json({ error: "请求过于频繁，请稍后重试" });
  }

  next();
}

function sameOrigin(req: ExpressRequest) {
  const origin = req.get("origin");
  const referer = req.get("referer");
  const source = origin || referer;
  if (!source) return true;

  try {
    return new URL(source).host === req.get("host");
  } catch {
    return false;
  }
}

function scheduledSecretMatches(req: ExpressRequest) {
  // Vercel Cron fires a plain GET and cannot attach custom secret headers;
  // it identifies itself with x-vercel-cron-schedule (value = cron expr).
  // Accepting it keeps the daily expiry scan working end-to-end. The scan is
  // idempotent/deduped, so a spoofed trigger is low-risk.
  if (req.get("x-vercel-cron-schedule")) return true;
  const expected = process.env.SCHEDULED_TASK_SECRET || process.env.CRON_SECRET;
  const header =
    req.get("x-scheduled-secret") ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && header && header === expected);
}

export async function createApiApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));
  app.use(rateLimit);

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const scheduledHandler = async (req: ExpressRequest, res: ExpressResponse) => {
    if (!scheduledSecretMatches(req)) {
      return res.status(401).json({ error: "scheduled authentication failed" });
    }
    try {
      return res.json({ ok: true, result: await runExpiryCheck() });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "scheduled task failed",
        timestamp: new Date().toISOString(),
      });
    }
  };

  app.get("/api/scheduled/check-expiry", scheduledHandler);
  app.post("/api/scheduled/check-expiry", scheduledHandler);

  app.use("/api/trpc", (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      !sameOrigin(req)
    ) {
      return res.status(403).json({ error: "来源校验失败" });
    }
    next();
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return app;
}
