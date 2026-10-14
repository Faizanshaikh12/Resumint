import { createRequestHandler } from "react-router";
import { createAuth } from "~/auth/auth.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

function applySecurityHeaders(response: Response, isShareRoute: boolean): Response {
  const headers = new Headers(response.headers);

  // Global CSP: self-hosted scripts, styles, fonts, and data images; frame-ancestors none
  if (!headers.has("Content-Security-Policy")) {
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    );
  }

  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // Phase 8 stricter headers for public share routes
  if (isShareRoute) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isShareRoute = url.pathname.startsWith("/r/");

    let response: Response;

    // Direct edge routing for Better Auth endpoints (/api/auth/*)
    if (url.pathname.startsWith("/api/auth")) {
      try {
        const auth = createAuth(env, request);
        response = await auth.handler(request);
      } catch (err: unknown) {
        console.error("[AUTH_ERROR] Request failed on auth endpoint");
        return applySecurityHeaders(
          new Response(
            JSON.stringify({
              error: "Internal Auth Error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          ),
          isShareRoute
        );
      }
    } else {
      try {
        response = await requestHandler(request);
      } catch (err: unknown) {
        console.error("[SERVER_ERROR] Unhandled edge request exception:", err);
        return applySecurityHeaders(
          new Response("Internal Server Error", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          }),
          isShareRoute
        );
      }
    }

    return applySecurityHeaders(response, isShareRoute);
  },
} satisfies ExportedHandler<Env>;
