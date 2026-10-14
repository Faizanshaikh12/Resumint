import { env as defaultEnv } from "cloudflare:workers";

interface HealthLoaderArgs {
  context?: { cloudflare?: { env?: Env } };
}

export async function loader({ context }: HealthLoaderArgs = {}) {
  const env = context?.cloudflare?.env ?? defaultEnv;

  try {
    if (!env?.DB) {
      throw new Error("Missing D1 database binding (DB)");
    }

    // 1. Connectivity Ping (SELECT 1)
    const pingResult = await env.DB.prepare("SELECT 1 as ping").first<{ ping: number }>();
    if (pingResult?.ping !== 1) {
      throw new Error("D1 ping returned unexpected result");
    }

    // 2. Schema / Table Integrity Check
    const tablesResult = await env.DB.prepare(
      "SELECT count(*) as count FROM sqlite_master WHERE type = 'table' AND name IN ('user', 'session', 'resumes', 'resume_snapshots', 'share_links')"
    ).first<{ count: number }>();

    const tableCount = tablesResult?.count ?? 0;
    const isSchemaReady = tableCount >= 5;
    if (!isSchemaReady) {
      throw new Error(`Incomplete schema: found ${tableCount}/5 required tables`);
    }

    return Response.json(
      {
        status: "ok",
        d1: "connected",
        schema: "ready",
        tablesVerified: tableCount,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[HEALTH_CHECK_ERROR] Health check failed:", error);
    return Response.json(
      {
        status: "error",
        check: "db",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
