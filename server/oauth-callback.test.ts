import { describe, expect, it, vi } from "vitest";
import { encodeOAuthState, OAUTH_STATE_COOKIE } from "../shared/const";

const dbMock = vi.hoisted(() => {
  process.env.GITHUB_CLIENT_ID ||= "test-github-client";
  process.env.GITHUB_CLIENT_SECRET ||= "test-github-secret";
  process.env.GITHUB_ALLOWED_USERNAME ||= "owner";
  process.env.SESSION_SECRET ||= "test-session-secret-that-is-long-enough";
  return { upsertUser: vi.fn().mockResolvedValue(undefined) };
});

vi.mock("./db", () => dbMock);

const { registerOAuthRoutes } = await import("./_core/oauth");

function createRoute() {
  let handler: ((req: any, res: any) => Promise<void>) | undefined;
  const app = {
    get(_path: string, callback: (req: any, res: any) => Promise<void>) {
      handler = callback;
    },
  };
  registerOAuthRoutes(app as any);
  if (!handler) throw new Error("OAuth callback route was not registered");
  return handler;
}

function createResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    cookies: [] as Array<{ name: string; value: string }>,
    cleared: [] as string[],
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
    clearCookie(name: string) {
      response.cleared.push(name);
      return response;
    },
    cookie(name: string, value: string) {
      response.cookies.push({ name, value });
      return response;
    },
    redirect(code: number, location: string) {
      response.statusCode = code;
      response.location = location;
      return response;
    },
  };
  return response;
}

function createRequest(query: Record<string, string>, nonce?: string) {
  return {
    query,
    protocol: "https",
    headers: nonce ? { cookie: `${OAUTH_STATE_COOKIE}=${nonce}` } : {},
    get(name: string) {
      if (name.toLowerCase() === "host") return "renewal-radar-three.vercel.app";
      return undefined;
    },
  };
}

describe("GitHub OAuth callback", () => {
  it("rejects missing authorization parameters with 400", async () => {
    const response = createResponse();
    await createRoute()(createRequest({}), response);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "code and state are required" });
  });

  it("rejects a mismatched state nonce with 403", async () => {
    const response = createResponse();
    const state = encodeOAuthState({
      redirectUri: "https://renewal-radar-three.vercel.app/api/oauth/callback",
      nonce: "expected-nonce",
    });
    await createRoute()(createRequest({ code: "code", state }, "different-nonce"), response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: "invalid oauth state" });
  });

  it("exchanges the code, syncs the user, sets a session, and redirects", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("login/oauth/access_token")) {
        return new Response(JSON.stringify({ access_token: "github-access-token" }), { status: 200 });
      }
      if (url.endsWith("/user/emails")) {
        return new Response(JSON.stringify([{ email: "owner@example.com", primary: true, verified: true }]), { status: 200 });
      }
      return new Response(JSON.stringify({ id: 7, login: "owner", name: "Owner" }), { status: 200 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const nonce = "success-nonce";
      const state = encodeOAuthState({
        redirectUri: "https://renewal-radar-three.vercel.app/api/oauth/callback",
        nonce,
      });
      const response = createResponse();
      await createRoute()(createRequest({ code: "code", state }, nonce), response);

      expect(response.statusCode).toBe(302);
      expect(response.location).toBe("/dashboard");
      expect(response.cookies[0]?.name).toBe("app_session_id");
      expect(dbMock.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          openId: "github:7",
          email: "owner@example.com",
          loginMethod: "github",
        })
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
