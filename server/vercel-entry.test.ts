import { describe, expect, it } from "vitest";
import { createApp } from "./_core/index.js";

function invoke(app: any, method: string, path: string) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = {
      method,
      url: path,
      originalUrl: path,
      headers: {},
      get(name: string) {
        return this.headers[name.toLowerCase()];
      },
      ip: "127.0.0.1",
    };
    const chunks: Buffer[] = [];
    const res = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeader() {
        return undefined;
      },
      removeHeader() {},
      end(chunk?: string | Buffer) {
        if (chunk) chunks.push(Buffer.from(chunk));
        resolve({ status: this.statusCode, body: Buffer.concat(chunks).toString() });
      },
      json(value: unknown) {
        this.setHeader("content-type", "application/json");
        this.end(JSON.stringify(value));
      },
    };
    app(req, res, reject);
  });
}

describe("Vercel application entry", () => {
  it("creates an API-only Express app without exposing the frontend bundle", async () => {
    const app = await createApp({ serveFrontend: false });
    const result = await invoke(app, "GET", "/api/scheduled/check-expiry");

    expect(result.status).toBe(401);
    expect(result.body).toContain("scheduled authentication failed");
  });
});
