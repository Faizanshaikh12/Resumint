import type { Route } from "./+types/login";
import { requireGuest } from "~/auth/helpers.server";
import { AuthForm } from "~/components/auth/AuthForm";

export function meta() {
  return [
    { title: "Log In | Resumint" },
    { name: "description", content: "Log in to your Resumint resume workspace." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  await requireGuest(request, env);
  const url = new URL(request.url);
  return { redirectTo: url.searchParams.get("redirectTo") || undefined };
}

export default function LoginPage({
  loaderData,
}: {
  loaderData: { redirectTo?: string };
}) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <AuthForm mode="signin" redirectTo={loaderData.redirectTo} />
      </div>
    </div>
  );
}
