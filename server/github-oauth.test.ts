import { describe, expect, it } from "vitest";
import { encodeOAuthState, decodeOAuthState } from "../shared/const";
import { normalizeGitHubIdentity } from "./_core/oauth";

describe("GitHub OAuth", () => {
  it("uses a stable GitHub identity and prefers a verified primary email", () => {
    const identity = normalizeGitHubIdentity(
      { id: 42, login: "nodelock", name: "Node Lock" },
      [
        { email: "secondary@example.com", verified: true, primary: false },
        { email: "primary@example.com", verified: true, primary: true },
      ]
    );

    expect(identity).toEqual({
      openId: "github:42",
      name: "Node Lock",
      email: "primary@example.com",
      loginMethod: "github",
    });
  });

  it("round-trips the callback redirect and CSRF nonce in state", () => {
    const encoded = encodeOAuthState({
      redirectUri: "https://renewal-radar-three.vercel.app/api/oauth/callback",
      nonce: "nonce-for-test",
    });

    expect(decodeOAuthState(encoded)).toEqual({
      redirectUri: "https://renewal-radar-three.vercel.app/api/oauth/callback",
      nonce: "nonce-for-test",
    });
  });
});
