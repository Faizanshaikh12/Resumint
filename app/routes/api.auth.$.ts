import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { env } from "cloudflare:workers";
import { createAuth } from "~/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const auth = createAuth(env, request);
    return await auth.handler(request);
  } catch (err: any) {
    console.error("[AUTH LOADER ERROR]", err);
    return Response.json(
      { error: err?.message || String(err), stack: err?.stack },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const auth = createAuth(env, request);
    return await auth.handler(request);
  } catch (err: any) {
    console.error("[AUTH ACTION ERROR]", err);
    return Response.json(
      { error: err?.message || String(err), stack: err?.stack },
      { status: 500 }
    );
  }
}
