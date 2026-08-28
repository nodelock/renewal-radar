import express from "express";

// Vercel's function compiler can resolve Express's ambient generic types differently
// from the local TypeScript toolchain. Keep this thin framework boundary explicit.
type ExpressRequest = any;
type ExpressResponse = any;
type ExpressNext = any;
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { registerStorageProxy } from "./storageProxy.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";
import { runExpiryCheck } from "../domain-service.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error("No available port found");
}

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
  const expected = process.env.SCHEDULED_TASK_SECRET || process.env.CRON_SECRET;
  const header =
    req.get("x-scheduled-secret") ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && header && header === expected);
}

export async function createApp(options: { serveFrontend?: boolean } = {}) {
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

  if (options.serveFrontend !== false) {
    if (process.env.NODE_ENV === "development") {
      const server = createServer(app);
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  const server = createServer(app);
  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}
