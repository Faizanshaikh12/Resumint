import { redirect } from "react-router";
import { createAuth } from "~/auth/auth.server";

export async function action({
  request,
}: {
  request: Request;
}) {
  const { env } = await import("cloudflare:workers");
  const auth = createAuth(env as unknown as Env, request);
  const signOutResponse = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  const headers = new Headers();
  signOutResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      headers.append("Set-Cookie", value);
    }
  });

  return redirect("/login", { headers });
}

export async function loader() {
  return redirect("/dashboard");
}
