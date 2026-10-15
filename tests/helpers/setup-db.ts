export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "email_verified" integer DEFAULT 0 NOT NULL,
    "image" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email")`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" integer NOT NULL,
    "token" text NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token")`,
  `CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" integer NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "resumes" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "title" text DEFAULT 'Untitled Resume' NOT NULL,
    "template_id" text DEFAULT 'modern' NOT NULL,
    "content" text NOT NULL,
    "design" text NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS "resumes_user_id_updated_at_idx" ON "resumes" ("user_id", "updated_at")`,
  `CREATE TABLE IF NOT EXISTS "resume_snapshots" (
    "id" text PRIMARY KEY NOT NULL,
    "resume_id" text NOT NULL,
    "content" text NOT NULL,
    "design" text NOT NULL,
    "label" text,
    "created_at" integer NOT NULL,
    FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS "snapshots_resume_id_created_at_idx" ON "resume_snapshots" ("resume_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "share_links" (
    "id" text PRIMARY KEY NOT NULL,
    "resume_id" text NOT NULL,
    "slug" text NOT NULL,
    "is_active" integer DEFAULT 1 NOT NULL,
    "allow_download" integer DEFAULT 1 NOT NULL,
    "noindex" integer DEFAULT 1 NOT NULL,
    "hide_contact" integer DEFAULT 0 NOT NULL,
    "password_hash" text,
    "expires_at" integer,
    "view_count" integer DEFAULT 0 NOT NULL,
    "created_at" integer NOT NULL,
    FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "share_links_resume_id_unique" ON "share_links" ("resume_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "share_links_slug_unique" ON "share_links" ("slug")`,
  `CREATE TABLE IF NOT EXISTS "template_master" (
    "id" text PRIMARY KEY NOT NULL,
    "key" text NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "tier" text DEFAULT 'standard' NOT NULL,
    "design" text NOT NULL,
    "layout" text NOT NULL,
    "sample_content" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" integer DEFAULT 1 NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "template_master_key_unique" ON "template_master" ("key")`,
  `CREATE INDEX IF NOT EXISTS "template_master_tier_sort_idx" ON "template_master" ("tier", "sort_order")`,
];

export async function setupTestDatabase(env: Env): Promise<void> {
  await env.DB.prepare("PRAGMA foreign_keys = ON;").run();
  for (const stmt of SCHEMA_STATEMENTS) {
    await env.DB.prepare(stmt).run();
  }
}
