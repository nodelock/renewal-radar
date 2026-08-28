import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { ENV } from "./_core/env.js";
import { InsertUser, users } from "../drizzle/schema.js";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
const previewUsers = new Map<string, any>();
let previewUserId = 1;

export async function getDb() {
  if (!db && ENV.databaseUrl && /^postgres(ql)?:/i.test(ENV.databaseUrl)) {
    pool = new Pool({ connectionString: ENV.databaseUrl, max: 5, ssl: ENV.databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    db = drizzle(pool);
  }
  return db;
}

export function buildUserUpdateSet(user: InsertUser): Partial<InsertUser> {
  const updateSet: Partial<InsertUser> = { lastSignedIn: user.lastSignedIn ?? new Date() };
  // Only overwrite profile fields when the caller explicitly provided them.
  // authenticateRequest() heartbeats every request with just
  // { openId, lastSignedIn } — overwriting name/email there would wipe the
  // stored profile to NULL and make the sidebar render "-"/"-" placeholders.
  if (user.name !== undefined) updateSet.name = user.name ?? null;
  if (user.email !== undefined) updateSet.email = user.email ?? null;
  if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod ?? null;
  if (user.role) updateSet.role = user.role;
  else if (user.openId === ENV.ownerOpenId) updateSet.role = "admin";
  return updateSet;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) {
    if (process.env.NODE_ENV === "development") {
      const now = new Date();
      const existing = previewUsers.get(user.openId);
      previewUsers.set(user.openId, { id: existing?.id ?? previewUserId++, openId: user.openId, name: user.name ?? existing?.name ?? null, email: user.email ?? existing?.email ?? null, loginMethod: user.loginMethod ?? existing?.loginMethod ?? "preview", role: user.role ?? "user", createdAt: existing?.createdAt ?? now, updatedAt: now, lastSignedIn: user.lastSignedIn ?? now });
      return;
    }
    throw new Error("PostgreSQL DATABASE_URL未配置");
  }

  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date() };
  if (user.role) values.role = user.role;
  else if (user.openId === ENV.ownerOpenId) values.role = "admin";
  const updateSet = buildUserUpdateSet(user);

  await database.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return process.env.NODE_ENV === "development" ? previewUsers.get(openId) : undefined;
  const rows = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}
