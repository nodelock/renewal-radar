import { describe, expect, it } from "vitest";
import { buildUserUpdateSet } from "./db.js";

describe("buildUserUpdateSet", () => {
  it("heartbeat upserts (openId + lastSignedIn only) must not wipe name/email", () => {
    const set = buildUserUpdateSet({
      openId: "github:207698090",
      lastSignedIn: new Date("2026-08-29T00:00:00Z"),
    });

    expect(set.lastSignedIn).toBeInstanceOf(Date);
    expect(set).not.toHaveProperty("name");
    expect(set).not.toHaveProperty("email");
    expect(set).not.toHaveProperty("loginMethod");
  });

  it("oauth callback upserts keep name/email/loginMethod in the update set", () => {
    const set = buildUserUpdateSet({
      openId: "github:207698090",
      name: "Node Lock",
      email: "nodelock@example.com",
      loginMethod: "github",
      lastSignedIn: new Date("2026-08-29T00:00:00Z"),
    });

    expect(set).toMatchObject({
      name: "Node Lock",
      email: "nodelock@example.com",
      loginMethod: "github",
    });
  });

  it("explicitly passed null email stays null (GitHub account has no email)", () => {
    const set = buildUserUpdateSet({
      openId: "github:42",
      name: "No Email",
      email: null,
      loginMethod: "github",
    });

    expect(set.email).toBeNull();
  });

  it("does not grant admin when no role or owner match is involved", () => {
    const set = buildUserUpdateSet({
      openId: "github:123456",
      lastSignedIn: new Date(),
    });

    expect(set.role).toBeUndefined();
  });

  it("preserves an explicitly supplied role", () => {
    const set = buildUserUpdateSet({
      openId: "github:42",
      role: "admin",
    });

    expect(set.role).toBe("admin");
  });
});