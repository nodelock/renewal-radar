import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { domains, jobRuns, notificationLogs } from "../drizzle/schema";
import { getDb } from "./db";

export const domainInput = z.object({
  name: z.string().trim().min(3).max(253).regex(/^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/, "请输入有效域名"),
  registrar: z.string().trim().max(160).optional().nullable(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "到期日必须为YYYY-MM-DD"),
  renewUrl: z.string().trim().max(2048).url().refine(value => value.startsWith("https://"), "续期链接必须使用HTTPS").optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  notifyDays: z.number().int().min(1).max(365).default(30),
});

export type DomainInput = z.infer<typeof domainInput>;

type PreviewDomain = DomainInput & { id: string; ownerId: number; status: "active" | "archived"; createdAt: Date; updatedAt: Date };
const previewDomains = new Map<number, PreviewDomain[]>();
const previewJobs = new Map<number, any[]>();
function previewMode() { return process.env.NODE_ENV === "development"; }
function previewSeed(ownerId: number) {
  if (!previewDomains.has(ownerId)) {
    const now = new Date();
    previewDomains.set(ownerId, [
      { id: "preview-healthy", ownerId, name: "example.org", registrar: "Example Registrar", expiryDate: dayOffset(186), renewUrl: "https://example.org/renew", note: "示例：健康资产", notifyDays: 30, status: "active", createdAt: now, updatedAt: now },
      { id: "preview-soon", ownerId, name: "studio.example", registrar: "Demo Registrar", expiryDate: dayOffset(18), renewUrl: "https://studio.example/renew", note: "示例：即将到期", notifyDays: 30, status: "active", createdAt: now, updatedAt: now },
      { id: "preview-expired", ownerId, name: "archive.example", registrar: "Demo Registrar", expiryDate: dayOffset(-7), renewUrl: "https://archive.example/renew", note: "示例：已过期", notifyDays: 30, status: "active", createdAt: now, updatedAt: now },
    ]);
  }
  return previewDomains.get(ownerId)!;
}
function previewError() { throw new Error("DATABASE_URL未配置"); }

function dayOffset(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function listDomains(ownerId: number, includeArchived = false) {
  const db = await getDb();
  if (!db) return previewMode() ? previewSeed(ownerId).filter(row => includeArchived || row.status === "active") : [];
  return db.select().from(domains).where(includeArchived ? eq(domains.ownerId, ownerId) : and(eq(domains.ownerId, ownerId), eq(domains.status, "active"))).orderBy(asc(domains.expiryDate));
}

export async function createDomain(ownerId: number, input: DomainInput) {
  const db = await getDb();
  if (!db) { if (!previewMode()) previewError(); const parsed = domainInput.parse(input); const now = new Date(); const row = { ...parsed, id: `preview-${Date.now()}`, ownerId, status: "active" as const, createdAt: now, updatedAt: now }; previewSeed(ownerId).push(row); return row; }
  const parsed = domainInput.parse(input);
  const [row] = await db.insert(domains).values({ ...parsed, ownerId, registrar: parsed.registrar ?? null, renewUrl: parsed.renewUrl ?? null, note: parsed.note ?? null }).returning();
  return row;
}

export async function updateDomain(ownerId: number, id: string, input: DomainInput) {
  const db = await getDb();
  if (!db) { if (!previewMode()) previewError(); const parsed = domainInput.parse(input); const rows = previewSeed(ownerId); const index = rows.findIndex(row => row.id === id); if (index < 0) throw new Error("域名不存在"); rows[index] = { ...rows[index], ...parsed, updatedAt: new Date() }; return rows[index]; }
  const parsed = domainInput.parse(input);
  const [row] = await db.update(domains).set({ ...parsed, registrar: parsed.registrar ?? null, renewUrl: parsed.renewUrl ?? null, note: parsed.note ?? null, updatedAt: new Date() }).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId))).returning();
  if (!row) throw new Error("域名不存在");
  return row;
}

export async function archiveDomain(ownerId: number, id: string) {
  const db = await getDb();
  if (!db) { if (!previewMode()) previewError(); const row = previewSeed(ownerId).find(item => item.id === id); if (!row) throw new Error("域名不存在"); row.status = "archived"; row.updatedAt = new Date(); return { id, status: row.status }; }
  const [row] = await db.update(domains).set({ status: "archived", updatedAt: new Date() }).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId))).returning({ id: domains.id, status: domains.status });
  if (!row) throw new Error("域名不存在");
  return row;
}

export async function restoreDomain(ownerId: number, id: string) {
  const db = await getDb();
  if (!db) { if (!previewMode()) previewError(); const row = previewSeed(ownerId).find(item => item.id === id); if (!row) throw new Error("域名不存在"); row.status = "active"; row.updatedAt = new Date(); return { id, status: row.status }; }
  const [row] = await db.update(domains).set({ status: "active", updatedAt: new Date() }).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId))).returning({ id: domains.id, status: domains.status });
  if (!row) throw new Error("域名不存在");
  return row;
}

export async function deleteDomain(ownerId: number, id: string) {
  const db = await getDb();
  if (!db) { if (!previewMode()) previewError(); const rows = previewSeed(ownerId); const index = rows.findIndex(item => item.id === id); if (index < 0) throw new Error("域名不存在"); rows.splice(index, 1); return { id }; }
  const [row] = await db.delete(domains).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId))).returning({ id: domains.id });
  if (!row) throw new Error("域名不存在");
  return row;
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram密钥未配置");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }) });
  const payload = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string };
  if (!response.ok || !payload.ok) throw new Error(payload.description || `Telegram请求失败(${response.status})`);
  return payload.result?.message_id?.toString() ?? null;
}

export async function runExpiryCheck() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL未配置");
  const [run] = await db.insert(jobRuns).values({ jobName: "daily-expiry-check", status: "running" }).returning({ id: jobRuns.id });
  const today = new Date().toISOString().slice(0, 10);
  const horizon = dayOffset(30);
  const candidates = await db.select().from(domains).where(and(eq(domains.status, "active"), lte(domains.expiryDate, horizon)));
  let notified = 0;
  let failed = 0;
  for (const domain of candidates) {
    const daysLeft = Math.ceil((new Date(`${domain.expiryDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
    const type = daysLeft < 0 ? "expired" : "renewal-30d";
    if (daysLeft >= 0 && daysLeft > domain.notifyDays) continue;
    const existing = await db.select({ id: notificationLogs.id, status: notificationLogs.status }).from(notificationLogs).where(and(eq(notificationLogs.domainId, domain.id), eq(notificationLogs.type, type), eq(notificationLogs.targetDate, domain.expiryDate))).limit(1);
    if (existing[0]?.status === "sent") continue;
    const message = `${type === "expired" ? "域名已过期" : "域名续期提醒"}\n域名：${domain.name}\n到期日：${domain.expiryDate}\n剩余：${daysLeft < 0 ? `${Math.abs(daysLeft)} 天` : `${daysLeft} 天`}\n续期：${domain.renewUrl || "未设置"}`;
    try {
      const messageId = await sendTelegram(message);
      if (existing[0]) await db.update(notificationLogs).set({ status: "sent", errorMessage: null, telegramMessageId: messageId, sentAt: new Date() }).where(eq(notificationLogs.id, existing[0].id));
      else await db.insert(notificationLogs).values({ domainId: domain.id, ownerId: domain.ownerId, type, targetDate: domain.expiryDate, status: "sent", telegramMessageId: messageId });
      notified++;
    } catch (error) {
      failed++;
      const messageError = error instanceof Error ? error.message : "unknown error";
      if (existing[0]) await db.update(notificationLogs).set({ status: "failed", errorMessage: messageError, sentAt: new Date() }).where(eq(notificationLogs.id, existing[0].id));
      else await db.insert(notificationLogs).values({ domainId: domain.id, ownerId: domain.ownerId, type, targetDate: domain.expiryDate, status: "failed", errorMessage: messageError }).onConflictDoNothing();
    }
  }
  await db.update(jobRuns).set({ status: failed ? "failed" : "success", scannedCount: candidates.length, notifiedCount: notified, failedCount: failed, finishedAt: new Date() }).where(eq(jobRuns.id, run.id));
  return { scanned: candidates.length, notified, failed };
}

export async function recentJobRuns(ownerId = 0) {
  const db = await getDb();
  if (!db) return previewMode() ? (previewJobs.get(ownerId) ?? []) : [];
  return db.select().from(jobRuns).orderBy(desc(jobRuns.startedAt)).limit(8);
}
