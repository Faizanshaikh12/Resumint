import { nanoid } from "nanoid";
import { getDb, type Database } from "~/db/client";
import { user, resumes, type User, type Resume, type InsertUser } from "~/db/schema";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";

export function createTestDb(env: Env): Database {
  return getDb(env);
}

export async function makeUser(
  db: Database,
  overrides?: Partial<InsertUser>
): Promise<User> {
  const id = overrides?.id ?? `user-${nanoid(8)}`;
  const newUser: InsertUser = {
    id,
    name: overrides?.name ?? `Test User ${nanoid(4)}`,
    email: overrides?.email ?? `${id}@test.resumint.dev`,
    emailVerified: overrides?.emailVerified ?? true,
    image: overrides?.image ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  const [inserted] = await db.insert(user).values(newUser).returning();
  if (!inserted) throw new Error("Failed to create test user");
  return inserted;
}

export async function makeResume(
  db: Database,
  userId: string,
  overrides?: Partial<Resume>
): Promise<Resume> {
  const newResume = {
    id: overrides?.id ?? nanoid(12),
    userId,
    title: overrides?.title ?? "Test Resume",
    templateId: overrides?.templateId ?? "modern",
    content: overrides?.content ?? createDefaultContent(),
    design: overrides?.design ?? createDefaultDesign(),
    version: overrides?.version ?? 1,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };

  const [inserted] = await db.insert(resumes).values(newResume).returning();
  if (!inserted) throw new Error("Failed to create test resume");
  return inserted;
}
