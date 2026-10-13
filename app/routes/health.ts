import { env } from "cloudflare:workers";

export async function loader() {
  try {
    // 1. Connectivity Ping
    const pingResult = await env.DB.prepare("SELECT 1 as ping").first<{ ping: number }>();

    // 2. Schema / Table Integrity Check
    const tablesResult = await env.DB.prepare(
      "SELECT count(*) as count FROM sqlite_master WHERE type = 'table' AND name IN ('user', 'session', 'resumes', 'resume_snapshots', 'share_links')"
    ).first<{ count: number }>();

    const tableCount = tablesResult?.count ?? 0;
    const isSchemaReady = tableCount >= 5;

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      d1: pingResult?.ping === 1 ? "connected" : "unexpected_result",
      schema: isSchemaReady ? "ready" : "pending_migrations",
      tablesVerified: tableCount,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
