import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const domainStatus = pgEnum("domain_status", ["active", "archived"]);
export const notificationStatus = pgEnum("notification_status", ["sent", "failed"]);
export const jobStatus = pgEnum("job_status", ["running", "success", "failed"]);

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 253 }).notNull(),
  registrar: varchar("registrar", { length: 160 }),
  expiryDate: date("expiry_date").notNull(),
  renewUrl: text("renew_url"),
  note: text("note"),
  notifyDays: integer("notify_days").default(30).notNull(),
  status: domainStatus("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  ownerStatusIdx: index("domains_owner_status_idx").on(table.ownerId, table.status),
  expiryIdx: index("domains_expiry_idx").on(table.expiryDate),
}));

export const notificationLogs = pgTable("notification_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  domainId: uuid("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(),
  targetDate: date("target_date").notNull(),
  status: notificationStatus("status").notNull(),
  errorMessage: text("error_message"),
  telegramMessageId: varchar("telegram_message_id", { length: 64 }),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  dedupeIdx: uniqueIndex("notification_dedupe_idx").on(table.domainId, table.type, table.targetDate),
  ownerIdx: index("notification_owner_idx").on(table.ownerId, table.sentAt),
}));

export const jobRuns = pgTable("job_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobName: varchar("job_name", { length: 80 }).notNull(),
  status: jobStatus("status").notNull(),
  scannedCount: integer("scanned_count").default(0).notNull(),
  notifiedCount: integer("notified_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, table => ({
  jobTimeIdx: index("job_runs_job_time_idx").on(table.jobName, table.startedAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type JobRun = typeof jobRuns.$inferSelect;
