import { redirect } from "react-router";
import { createAuth } from "./auth.server";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

import { safeRedirect } from "./redirect";
export { safeRedirect };

async function resolveEnv(env?: Env): Promise<Env> {
  if (env) return env;
  try {
    const mod = "cloudflare:workers";
    const cf = (await import(/* @vite-ignore */ mod)) as { env: Env };
    return cf.env;
  } catch {
    return (globalThis as unknown as { env: Env }).env || ({} as Env);
  }
}

/**
 * Retrieves the authenticated session from the incoming request cookies.
 * Returns null if the request lacks a valid, active session.
 */
export async function getSession(
  request: Request,
  envInput?: Env
): Promise<AuthSession | null> {
  const env = await resolveEnv(envInput);
  const auth = createAuth(env, request);
  const sessionData = await auth.api.getSession({
    headers: request.headers,
  });

  if (!sessionData?.user) {
    return null;
  }

  return {
    user: {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      emailVerified: sessionData.user.emailVerified,
      image: sessionData.user.image,
    },
    session: {
      id: sessionData.session.id,
      expiresAt: new Date(sessionData.session.expiresAt),
      ipAddress: sessionData.session.ipAddress,
      userAgent: sessionData.session.userAgent,
    },
  };
}

/**
 * Enforces an authenticated session. If unauthenticated, throws a redirect
 * to /login with a safe encoded redirectTo query parameter.
 */
export async function requireUser(
  request: Request,
  envInput?: Env
): Promise<AuthUser> {
  const session = await getSession(request, envInput);
  if (!session) {
    const url = new URL(request.url);
    const targetPath = url.pathname + url.search;
    const safePath = safeRedirect(targetPath, "/dashboard");
    throw redirect(`/login?redirectTo=${encodeURIComponent(safePath)}`);
  }
  return session.user;
}

/**
 * Guards guest-only pages (e.g. /login, /signup).
 * If the user is already authenticated, redirects them away to /dashboard or their intended path.
 */
export async function requireGuest(
  request: Request,
  envInput?: Env,
  defaultPath = "/dashboard"
): Promise<void> {
  const session = await getSession(request, envInput);
  if (session) {
    const url = new URL(request.url);
    const redirectTo = safeRedirect(url.searchParams.get("redirectTo"), defaultPath);
    throw redirect(redirectTo);
  }
}
