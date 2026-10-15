import { describe, expect, it } from "vitest";
import { domainInput, formatExpiryMessage } from "./domain-service.js";

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

  it("links only the domain text and uses a readable renewal link label", () => {
    const message = formatExpiryMessage({ type: "renewal-30d", name: "judazi.com", expiryDate: "2026-11-14", daysLeft: 30, renewUrl: "https://www.namesilo.com" });
    expect(message).toContain('域名：<a href="https://judazi.com">judazi.com</a>');
    expect(message).toContain('续期：<a href="https://www.namesilo.com">打开续期页面</a>');
    expect(message).not.toContain("🔗");
    expect(message).not.toContain('域名：<a href="https://judazi.com">域名：');
  });

  it("escapes Telegram HTML content", () => {
    const message = formatExpiryMessage({ type: "renewal-30d", name: "safe.com", expiryDate: "2026-11-14", daysLeft: 30, renewUrl: "https://example.com/?a=1&b=2" });
    expect(message).toContain("a=1&amp;b=2");
    expect(message).not.toContain("<script");
  });
});
