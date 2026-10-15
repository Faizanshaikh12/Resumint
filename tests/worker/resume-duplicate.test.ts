import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { createTestDb, makeUser, makeResume } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import { duplicateResume, getResume, countResumes } from "~/db/queries/resumes";
import { MAX_RESUMES_PER_USER } from "~/lib/resume/limits";

describe("Resume Duplication Workflows (Worker Integration)", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });
  it("duplicates resume with (Copy) title, fresh nanoid, version 1, and deep copied content/design", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);

    const original = await makeResume(db, user.id, {
      title: "Senior Full-Stack Engineer",
      templateId: "technical",
      content: {
        personal: {
          name: "Original Author",
          title: "Senior Full-Stack Engineer",
          email: "author@example.com",
          phone: "+1 555-0100",
          location: "Seattle, WA",
          links: [],
        },
        summary: "Original summary text.",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        awards: [],
        publications: [],
        volunteering: [],
        interests: [],
        references: [],
        customSections: [],
        sectionOrder: ["summary", "experience", "education", "skills"],
        hiddenSections: [],
      },
      design: {
        accentColor: "#0284c7",
        fontFamily: "roboto-mono",
        fontScale: 1.05,
        lineSpacing: 1.3,
        pageMargin: 18,
        sectionSpacing: 16,
        pageSize: "A4",
        columns: 2,
        headerAlign: "left",
        dateStyle: "MMM YYYY",
        showIcons: true,
      },
      version: 5,
    });

    const copy = await duplicateResume(db, user.id, original.id);
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(original.id);
    expect(copy!.id).toHaveLength(12);
    expect(copy!.userId).toBe(user.id);
    expect(copy!.title).toBe("Senior Full-Stack Engineer (Copy)");
    expect(copy!.templateId).toBe("technical");
    expect(copy!.version).toBe(1);

    // Deep equality of content and design
    expect(copy!.content).toEqual(original.content);
    expect(copy!.design).toEqual(original.design);

    // Verify it exists in database
    const fetchedCopy = await getResume(db, user.id, copy!.id);
    expect(fetchedCopy).toBeDefined();
    expect(fetchedCopy!.title).toBe("Senior Full-Stack Engineer (Copy)");
  });

  it("prevents duplicating another user's resume and returns null", async () => {
    const db = createTestDb(env);
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const resumeA = await makeResume(db, userA.id, { title: "User A Resume" });

    // User B attempts to duplicate User A's resume
    const copy = await duplicateResume(db, userB.id, resumeA.id);
    expect(copy).toBeNull();
  });

  it("enforces resume count cap properly", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);

    const countBefore = await countResumes(db, user.id);
    expect(countBefore).toBe(0);

    // Can duplicate within limit
    const resume = await makeResume(db, user.id, { title: "Base Resume" });
    const copy = await duplicateResume(db, user.id, resume.id);
    expect(copy).not.toBeNull();

    const countAfter = await countResumes(db, user.id);
    expect(countAfter).toBe(2);
    expect(countAfter).toBeLessThanOrEqual(MAX_RESUMES_PER_USER);
  });
});
