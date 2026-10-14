import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

// ==========================================
// 1. Better Auth Tables (SQLite)
// ==========================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(), // SHA-256 hashed token
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
  })
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"), // Credentials provider password hash
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
  })
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==========================================
// 2. Application Domain Tables
// ==========================================

export const resumes = sqliteTable(
  "resumes",
  {
    id: text("id").primaryKey(), // nanoid(12)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled Resume"),
    templateId: text("template_id").notNull().default("modern"),
    content: text("content", { mode: "json" }).$type<ResumeContent>().notNull(),
    design: text("design", { mode: "json" }).$type<ResumeDesign>().notNull(),
    version: integer("version").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdUpdatedIdx: index("resumes_user_id_updated_at_idx").on(table.userId, table.updatedAt),
  })
);

export const resumeSnapshots = sqliteTable(
  "resume_snapshots",
  {
    id: text("id").primaryKey(), // nanoid
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    content: text("content", { mode: "json" }).$type<ResumeContent>().notNull(),
    design: text("design", { mode: "json" }).$type<ResumeDesign>().notNull(),
    label: text("label"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    resumeIdCreatedIdx: index("snapshots_resume_id_created_at_idx").on(
      table.resumeId,
      table.createdAt
    ),
  })
);

export const shareLinks = sqliteTable("share_links", {
  id: text("id").primaryKey(), // nanoid
  resumeId: text("resume_id")
    .notNull()
    .unique()
    .references(() => resumes.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(), // nanoid(14)
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  allowDownload: integer("allow_download", { mode: "boolean" }).notNull().default(true),
  noindex: integer("noindex", { mode: "boolean" }).notNull().default(true),
  hideContact: integer("hide_contact", { mode: "boolean" }).notNull().default(false),
  passwordHash: text("password_hash"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==========================================
// 3. Inferred TypeScript Types
// ==========================================

export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type InsertSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type InsertAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type InsertVerification = typeof verification.$inferInsert;

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export type ResumeSnapshot = typeof resumeSnapshots.$inferSelect;
export type InsertResumeSnapshot = typeof resumeSnapshots.$inferInsert;

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;
