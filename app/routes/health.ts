import { env } from "cloudflare:workers";
import type { Route } from "./+types/health";

export async function loader() {
  try {
    const result = await env.DB.prepare("SELECT 1 as ping").first<{ ping: number }>();
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      d1: result?.ping === 1 ? "connected" : "unexpected_result",
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
