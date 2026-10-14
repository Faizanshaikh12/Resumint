import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { Toaster } from "./components/ui/sonner";

import { getSession, type AuthUser } from "./auth/helpers.server";

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<{ user: AuthUser | null }> {
  try {
    const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
    const session = await getSession(request, env);
    return { user: session?.user ?? null };
  } catch (err) {
    console.error("[ROOT_LOADER_SESSION_ERROR]", err);
    return { user: null };
  }
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b" />
        <Meta />
        <Links />
        <script src="/theme-init.js"></script>
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 Not Found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "The requested page or resume could not be located."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">{message}</h1>
        <p className="mt-4 text-muted-foreground">{details}</p>
        {stack && (
          <pre className="mt-6 max-h-60 overflow-x-auto rounded-lg bg-muted p-4 text-left font-mono text-xs">
            <code>{stack}</code>
          </pre>
        )}
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Return to Safety
          </a>
        </div>
      </div>
    </div>
  );
}
