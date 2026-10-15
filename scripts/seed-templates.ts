import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { generateTemplateSeedSql } from "../app/db/seed/templates";

async function runTemplateSeed() {
  const isRemote = process.argv.includes("--remote");
  const targetFlag = isRemote ? "--remote" : "--local";

  console.log(`🌱 Seeding template_master table (${isRemote ? "REMOTE" : "LOCAL"})...`);

  const sql = generateTemplateSeedSql();
  const tempSqlFile = path.resolve(process.cwd(), `temp-templates-seed-${Date.now()}.sql`);
  fs.writeFileSync(tempSqlFile, sql, "utf-8");

  try {
    const cmd = `npx wrangler d1 execute DB ${targetFlag} --file="${tempSqlFile}"`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    console.log("✅ template_master seeding completed successfully!");
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      try {
        fs.unlinkSync(tempSqlFile);
      } catch {
        // ignore cleanup error
      }
    }
  }
}

runTemplateSeed().catch((err) => {
  console.error("❌ Failed to seed template_master:", err);
  process.exit(1);
});
