import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { sdk } from "./_core/sdk.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { archiveDomain, createDomain, deleteDomain, domainInput, listDomains, recentJobRuns, restoreDomain, runExpiryCheck, updateDomain } from "./domain-service.js";

const idInput = z.object({ id: z.string().uuid() });

function friendly(error: unknown): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "请求无法完成" });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieHeader =
        typeof ctx.req.headers?.cookie === "string" ? ctx.req.headers.cookie : "";
      const token = cookieHeader
        .split(";")
        .map((part: string) => part.trim())
        .find((part: string) => part.startsWith(`${COOKIE_NAME}=`))
        ?.slice(COOKIE_NAME.length + 1);

      // Revoke server-side so the session dies immediately even if the
      // browser does not drop the cookie.
      sdk.revokeSession(token);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Clear with an explicit past expiry (no maxAge fiddling) so every
      // browser deletes the cookie.
      ctx.res.clearCookie(COOKIE_NAME, {
        ...cookieOptions,
        expires: new Date(0),
      });
      return { success: true } as const;
    }),
  }),
  domains: router({
    list: protectedProcedure.input(z.object({ includeArchived: z.boolean().default(false) }).optional()).query(async ({ ctx, input }) => listDomains(ctx.user.id, input?.includeArchived ?? false)),
    create: protectedProcedure.input(domainInput).mutation(async ({ ctx, input }) => { try { return await createDomain(ctx.user.id, input); } catch (error) { return friendly(error); } }),
    update: protectedProcedure.input(idInput.extend(domainInput.shape)).mutation(async ({ ctx, input }) => { try { const { id, ...data } = input; return await updateDomain(ctx.user.id, id, data); } catch (error) { return friendly(error); } }),
    archive: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => { try { return await archiveDomain(ctx.user.id, input.id); } catch (error) { return friendly(error); } }),
    restore: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => { try { return await restoreDomain(ctx.user.id, input.id); } catch (error) { return friendly(error); } }),
    remove: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => { try { return await deleteDomain(ctx.user.id, input.id); } catch (error) { return friendly(error); } }),
  }),
  jobs: router({
    recent: protectedProcedure.query(() => recentJobRuns()),
    runNow: protectedProcedure.mutation(async () => { try { return await runExpiryCheck(); } catch (error) { return friendly(error); } }),
  }),
});

export type AppRouter = typeof appRouter;
