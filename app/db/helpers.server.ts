import { getDb, type Database } from "./client";

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

export async function getDatabase(envInput?: Env): Promise<Database> {
  const env = await resolveEnv(envInput);
  return getDb(env);
}
