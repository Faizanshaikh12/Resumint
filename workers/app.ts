import { createRequestHandler } from "react-router";
import { createAuth } from "~/auth/auth.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Direct edge routing for Better Auth endpoints (/api/auth/*)
    if (url.pathname.startsWith("/api/auth")) {
      try {
        const auth = createAuth(env, request);
        return await auth.handler(request);
      } catch (err: any) {
        console.error("[BETTER_AUTH_ERROR]", err);
        return new Response(
          JSON.stringify({
            error: err?.message || "Internal Auth Error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
