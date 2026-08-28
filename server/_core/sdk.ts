import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { ForbiddenError } from "../../shared/_core/errors.js";
import { SignJWT, jwtVerify } from "jose";
type ExpressRequest = any;
import type { User } from "../../drizzle/schema.js";
import * as db from "../db.js";
import { ENV } from "./env.js";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// In-memory revocation list. JWTs are stateless, so a logged-out token would
// still verify until it expires; this map makes logout take effect immediately
// even if the browser fails to drop the cookie (e.g. Expires ambiguity).
// TTL matches the default session lifetime (ONE_YEAR_MS).
const REVOKED_TTL_MS = ONE_YEAR_MS;
const revokedTokens = new Map<string, number>();

function tokenKey(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return `${token.length}:${hash}`;
}

function pruneRevoked(now: number) {
  if (revokedTokens.size > 10_000) {
    for (const [key, expiresAt] of Array.from(revokedTokens.entries())) {
      if (expiresAt < now) revokedTokens.delete(key);
    }
  }
}

class SDKServer {
  private getSessionSecret() {
    if (!ENV.cookieSecret) {
      throw new Error("SESSION_SECRET is not configured");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: "github",
        name: options.name || "GitHub user",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(Math.floor(issuedAt / 1000))
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;

    const now = Date.now();
    pruneRevoked(now);
    const revokeExpiresAt = revokedTokens.get(tokenKey(cookieValue));
    if (revokeExpiresAt !== undefined && revokeExpiresAt >= now) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        return null;
      }

      return { openId, appId, name };
    } catch {
      return null;
    }
  }

  /**
   * Mark a session token as revoked so it can no longer authenticate, even if
   * the client cookie was not fully removed. Safe to call with an empty value.
   */
  revokeSession(cookieValue: string | undefined | null): void {
    if (!cookieValue) return;
    revokedTokens.set(tokenKey(cookieValue), Date.now() + REVOKED_TTL_MS);
  }

  async authenticateRequest(req: ExpressRequest): Promise<AuthenticatedUser> {
    const cookieHeader = typeof req.headers?.cookie === "string" ? req.headers.cookie : "";
    const sessionToken = cookieHeader
      .split(";")
      .map((part: string) => part.trim())
      .find((part: string) => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);
    const authorization = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
    const bearer = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;
    const session = await this.verifySession(sessionToken || bearer);

    if (!session) throw ForbiddenError("Invalid session cookie");

    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export type AuthenticatedUser = User;

export const sdk = new SDKServer();
