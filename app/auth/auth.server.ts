import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "~/db/client";
import * as schema from "~/db/schema";
import { hashPassword, verifyPassword } from "./crypto.server";

export function createAuth(env: Env, request?: Request) {
  const db = getDb(env);

  const configuredUrl = env.BETTER_AUTH_URL || "http://localhost:5173";
  let origin = configuredUrl;
  if (request) {
    try {
      const parsed = new URL(request.url);
      origin = parsed.origin;
    } catch {
      // fallback to configuredUrl
    }
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET || "resumint-dev-secret-key-32-chars-long-minimum-local!",
    baseURL: origin,
    basePath: "/api/auth",
    trustedOrigins: [
      origin,
      configuredUrl,
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "https://resumint.faizan-shaikh-dev.workers.dev",
    ],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      async sendResetPassword(data) {
        if (env.APP_ENV === "development" || !env.APP_ENV) {
          // Dev-only email stub logs the reset link locally
          console.log(`[AUTH DEV STUB] Reset link generated for ${data.user.email}: ${data.url}`);
        }
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours rolling renewal
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      cookiePrefix: "resumint",
      useSecureCookies: origin.startsWith("https://"),
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },
    onAPIError: {
      throw: false,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 10,
        },
        "/sign-up/email": {
          window: 60,
          max: 10,
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
