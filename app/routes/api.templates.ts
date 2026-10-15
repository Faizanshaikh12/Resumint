import { env as defaultEnv } from "cloudflare:workers";
import { templateMaster } from "~/db/schema";
import { TEMPLATE_SEED_DATA } from "~/db/seed/templates";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

interface ApiTemplatesLoaderArgs {
  context?: { cloudflare?: { env?: Env } };
}

const CACHE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function loader({ context }: ApiTemplatesLoaderArgs = {}) {
  const env = context?.cloudflare?.env ?? defaultEnv;

  try {
    if (env?.DB) {
      const db = drizzle(env.DB);
      const rows = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.isActive, true))
        .orderBy(asc(templateMaster.sortOrder));

      if (rows && rows.length > 0) {
        return Response.json({ templates: rows }, { headers: CACHE_HEADERS });
      }
    }
  } catch (err) {
    console.warn("[API_TEMPLATES] Failed to query template_master, falling back to seed data:", err);
  }

  // Graceful fallback to bundled seed templates
  const fallbackTemplates = TEMPLATE_SEED_DATA.filter((t) => t.isActive).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return Response.json({ templates: fallbackTemplates }, { headers: CACHE_HEADERS });
}
