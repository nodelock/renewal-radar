import { describe, expect, it } from "vitest";
import { domainInput } from "./domain-service";

describe("domainInput", () => {
  it("accepts a normal domain with an HTTPS renewal URL", () => {
    const result = domainInput.parse({ name: "example.com", expiryDate: "2026-12-31", renewUrl: "https://registrar.example/renew", notifyDays: 30 });
    expect(result.name).toBe("example.com");
    expect(result.notifyDays).toBe(30);
  });

  it("rejects non-HTTPS renewal links", () => {
    expect(() => domainInput.parse({ name: "example.com", expiryDate: "2026-12-31", renewUrl: "http://registrar.example/renew", notifyDays: 30 })).toThrow();
    expect(() => domainInput.parse({ name: "example.com", expiryDate: "2026-12-31", renewUrl: "javascript:alert(1)", notifyDays: 30 })).toThrow();
  });

  it("rejects invalid domain names and unsafe thresholds", () => {
    expect(() => domainInput.parse({ name: "not a domain", expiryDate: "2026-12-31", notifyDays: 30 })).toThrow();
    expect(() => domainInput.parse({ name: "example.com", expiryDate: "2026-12-31", notifyDays: 0 })).toThrow();
  });
});
