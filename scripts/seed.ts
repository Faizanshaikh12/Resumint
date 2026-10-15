import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createDefaultContent, createDefaultDesign } from "../app/lib/resume/defaults";
import { generateTemplateSeedSql } from "../app/db/seed/templates";

async function runSeed() {
  const isRemote = process.argv.includes("--remote");
  const targetFlag = isRemote ? "--remote" : "--local";

  console.log(`🌱 Seeding Resumint database (${isRemote ? "REMOTE" : "LOCAL"})...`);

  const now = Date.now();
  const demoUserId = "demo-user-1";

  // Build Sample Resumes
  const devContent = createDefaultContent();
  const devDesign = { ...createDefaultDesign(), fontFamily: "fira-code", accentColor: "#2563eb" };

  const studentContent = createDefaultContent();
  studentContent.personal.title = "Junior Software Developer";
  studentContent.summary = "Recent Computer Science honors graduate with a strong foundation in data structures, web development, and cloud computing.";
  const studentDesign = { ...createDefaultDesign(), fontFamily: "inter", accentColor: "#059669" };

  const designerContent = createDefaultContent();
  designerContent.personal.title = "Lead Product & UI/UX Designer";
  designerContent.summary = "Human-centered designer focused on scalable design systems, interaction patterns, and clean typography hierarchy.";
  const designerDesign = { ...createDefaultDesign(), fontFamily: "playfair", accentColor: "#7c3aed" };

  const escapeSql = (str: string) => str.replace(/'/g, "''");

  const sqlStatements = [
    // 1. Demo User
    `INSERT OR REPLACE INTO "user" ("id", "name", "email", "email_verified", "created_at", "updated_at")
     VALUES ('${demoUserId}', 'Demo User', 'demo@resumint.dev', 1, ${now}, ${now});`,

    // 2. Developer Resume
    `INSERT OR REPLACE INTO "resumes" ("id", "user_id", "title", "template_id", "content", "design", "version", "created_at", "updated_at")
     VALUES ('sample-dev', '${demoUserId}', 'Senior Full-Stack Engineer', 'technical', '${escapeSql(JSON.stringify(devContent))}', '${escapeSql(JSON.stringify(devDesign))}', 1, ${now}, ${now});`,

    // 3. Student Resume
    `INSERT OR REPLACE INTO "resumes" ("id", "user_id", "title", "template_id", "content", "design", "version", "created_at", "updated_at")
     VALUES ('sample-student', '${demoUserId}', 'Computer Science Graduate', 'modern', '${escapeSql(JSON.stringify(studentContent))}', '${escapeSql(JSON.stringify(studentDesign))}', 1, ${now}, ${now});`,

    // 4. Designer Resume
    `INSERT OR REPLACE INTO "resumes" ("id", "user_id", "title", "template_id", "content", "design", "version", "created_at", "updated_at")
     VALUES ('sample-designer', '${demoUserId}', 'Lead Product & UI Designer', 'minimal', '${escapeSql(JSON.stringify(designerContent))}', '${escapeSql(JSON.stringify(designerDesign))}', 1, ${now}, ${now});`,

    // 5. Template Master (10 Templates)
    generateTemplateSeedSql(),
  ];

  const tempSqlFile = path.resolve(process.cwd(), "temp-seed.sql");
  fs.writeFileSync(tempSqlFile, sqlStatements.join("\n"), "utf-8");

  try {
    const cmd = `npx wrangler d1 execute DB ${targetFlag} --file="${tempSqlFile}"`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    console.log("✅ Database seeding completed successfully!");
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      fs.unlinkSync(tempSqlFile);
    }
  }
}

runSeed().catch((err) => {
  console.error("❌ Failed to seed database:", err);
  process.exit(1);
});
