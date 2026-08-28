import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

type GitHubProfile = {
  id: number;
  login?: string;
  name?: string | null;
  email?: string | null;
};

type GitHubEmail = {
  email: string;
  primary?: boolean;
  verified?: boolean;
};

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRequestOrigin(req: Request) {
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host")}`;
}

export function getGitHubRedirectUri(req: Request) {
  return `${getRequestOrigin(req)}/api/oauth/callback`;
}

export function normalizeGitHubIdentity(profile: GitHubProfile, emails: GitHubEmail[]) {
  const verifiedPrimary = emails.find(email => email.primary && email.verified);
  const verifiedAny = emails.find(email => email.verified);
  const email = verifiedPrimary?.email ?? verifiedAny?.email ?? profile.email ?? null;
  const name = profile.name?.trim() || profile.login?.trim() || `GitHub user ${profile.id}`;

  return {
    openId: `github:${profile.id}`,
    name,
    email,
    loginMethod: "github",
  } as const;
}

async function exchangeCode(code: string, redirectUri: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Renewal-Radar",
    },
    body: JSON.stringify({
      client_id: ENV.githubClientId,
      client_secret: ENV.githubClientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) throw new Error(`GitHub token exchange failed: ${response.status}`);
  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!payload.access_token) throw new Error(payload.error || "GitHub access token missing");
  return payload.access_token;
}

async function getGitHubProfile(accessToken: string) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Renewal-Radar",
  };

  const [profileResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);

  if (!profileResponse.ok || !emailsResponse.ok) {
    throw new Error("GitHub user profile request failed");
  }

  return {
    profile: (await profileResponse.json()) as GitHubProfile,
    emails: (await emailsResponse.json()) as GitHubEmail[],
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    if (error) {
      res.status(400).json({ error: "GitHub authorization was cancelled" });
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (!ENV.githubClientId || !ENV.githubClientSecret) {
      res.status(503).json({ error: "GitHub OAuth is not configured" });
      return;
    }

    const { nonce, redirectUri } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    const expectedRedirectUri = getGitHubRedirectUri(req);

    if (
      !nonce ||
      nonce !== expectedNonce ||
      !redirectUri ||
      redirectUri !== expectedRedirectUri
    ) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }

    res.clearCookie(OAUTH_STATE_COOKIE, {
      path: "/",
      secure: true,
      sameSite: "lax",
    });

    try {
      const accessToken = await exchangeCode(code, expectedRedirectUri);
      const { profile, emails } = await getGitHubProfile(accessToken);
      if (!Number.isInteger(profile.id)) throw new Error("GitHub user id missing");

      const identity = normalizeGitHubIdentity(profile, emails);
      await db.upsertUser({
        openId: identity.openId,
        name: identity.name,
        email: identity.email,
        loginMethod: identity.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(identity.openId, {
        name: identity.name,
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, "/dashboard");
    } catch (callbackError) {
      console.error("[GitHub OAuth] Callback failed", callbackError);
      res.status(502).json({ error: "GitHub OAuth callback failed" });
    }
  });
}
