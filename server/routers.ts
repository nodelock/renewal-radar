import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies.js";
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
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
