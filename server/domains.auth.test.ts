import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("domains authorization", () => {
  it("rejects anonymous list requests", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.domains.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
