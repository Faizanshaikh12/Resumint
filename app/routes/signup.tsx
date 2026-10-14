import { requireGuest } from "~/auth/helpers.server";
import { AuthForm } from "~/components/auth/AuthForm";

export function meta() {
  return [
    { title: "Sign Up | Resumint" },
    { name: "description", content: "Create an account on Resumint to build and save your resumes." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request }: { request: Request }) {
  await requireGuest(request);
  const url = new URL(request.url);
  return { redirectTo: url.searchParams.get("redirectTo") || undefined };
}

export default function SignUpPage({
  loaderData,
}: {
  loaderData: { redirectTo?: string };
}) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <AuthForm mode="signup" redirectTo={loaderData.redirectTo} />
      </div>
    </div>
  );
}
