import React, { useState } from "react";
import { Link, useFetcher, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/r.$slug";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  FileQuestion,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getDatabase } from "~/db/helpers.server";
import {
  getRawShareLinkBySlug,
  getPublicResumeById,
  recordView,
} from "~/db/queries/shares";
import { getPublicShareStatus } from "~/lib/share/status";
import { redactContactDetails } from "~/lib/share/redact";
import { verifySharePassword } from "~/lib/share/password";
import {
  createUnlockToken,
  verifyUnlockToken,
  parseUnlockCookie,
  serializeUnlockCookie,
} from "~/lib/share/unlock-cookie";
import { isLikelyBot } from "~/lib/share/bots";
import { buildShareMeta } from "~/lib/share/meta";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PrintRoot } from "~/components/export/PrintRoot";
import { ResumePreview } from "~/components/preview/ResumePreview";
import { usePrintResume } from "~/lib/export/usePrintResume";
import { PrintHintDialog } from "~/components/export/PrintHintDialog";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { getSession } from "~/auth/helpers.server";

// Rate limiting in-memory store for password attempts per worker isolate
const failedAttemptsMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = failedAttemptsMap.get(key);
  if (!entry || now > entry.resetAt) {
    failedAttemptsMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  const h: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  };

  const robots = loaderHeaders.get("X-Robots-Tag");
  if (robots) {
    h["X-Robots-Tag"] = robots;
  }

  return h;
}

export function meta({ data }: Route.MetaArgs) {
  if (!data || data.locked || !data.content) {
    return [
      { title: "Protected Document | Resumint" },
      {
        name: "description",
        content: "This document is password-protected. Enter the password to view.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ];
  }

  return buildShareMeta(data.content, data.design, {
    noindex: data.noindex,
    hideContact: data.hideContact,
    isLocked: false,
  });
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const db = await getDatabase(env);
  const slug = params.slug;

  const link = await getRawShareLinkBySlug(db, slug);
  const status = getPublicShareStatus(link);

  // 1. Missing, revoked, or expired all return an identical 404
  if (status === "unavailable" || !link) {
    throw new Response("This link is unavailable", {
      status: 404,
      statusText: "Not Found",
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    });
  }

  const secret =
    env?.SHARE_COOKIE_SECRET ||
    env?.BETTER_AUTH_SECRET ||
    (typeof process !== "undefined" ? process.env?.BETTER_AUTH_SECRET : undefined) ||
    "fallback-secret";
  const cookieHeader = request.headers.get("cookie");

  // 2. Password verification check
  let isUnlocked = false;
  if (status === "password_required") {
    const token = parseUnlockCookie(cookieHeader, slug);
    if (token) {
      isUnlocked = await verifyUnlockToken(token, slug, link.passwordHash || "", secret);
    }

    if (!isUnlocked) {
      // Locked: Return minimal response, never candidate details
      return Response.json(
        {
          locked: true,
          slug,
          allowDownload: false,
          noindex: true,
          hideContact: false,
        },
        {
          headers: {
            "X-Robots-Tag": "noindex, nofollow",
            "Cache-Control": "no-store",
          },
        }
      );
    }
  }

  // 3. Unlocked or Passwordless State: Fetch resume details
  const resume = await getPublicResumeById(db, link.resumeId);
  if (!resume) {
    throw new Response("This link is unavailable", {
      status: 404,
      statusText: "Not Found",
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    });
  }

  // 4. View Counting: only real human views, not bots, not owner, not within 30 min dedupe
  const headers = new Headers();
  headers.set("Cache-Control", "no-store");

  if (link.noindex) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  const isBot = isLikelyBot(request);
  const dedupeCookieName = `rv_${slug}`;
  const isDeduped = Boolean(cookieHeader && cookieHeader.includes(dedupeCookieName));

  let isOwner = false;
  try {
    const session = await getSession(request, env);
    if (session && session.user && session.user.id) {
      const [ownerResume] = await db
        .select()
        .from(await import("~/db/schema").then((m) => m.resumes))
        .where(
          (await import("drizzle-orm")).and(
            (await import("drizzle-orm")).eq(
              (await import("~/db/schema").then((m) => m.resumes)).id,
              link.resumeId
            ),
            (await import("drizzle-orm")).eq(
              (await import("~/db/schema").then((m) => m.resumes)).userId,
              session.user.id
            )
          )
        )
        .limit(1);

      if (ownerResume) {
        isOwner = true;
      }
    }
  } catch {
    // Ignore auth lookup errors in public flow
  }

  if (!isBot && !isOwner && !isDeduped) {
    // Safe background view increment without blocking response
    const cf = (context as { cloudflare?: { ctx?: { waitUntil: (p: Promise<any>) => void } } })?.cloudflare;
    if (cf?.ctx?.waitUntil) {
      cf.ctx.waitUntil(recordView(db, slug, { isBot: false }));
    } else {
      void recordView(db, slug, { isBot: false });
    }

    // Set 30-minute dedupe cookie
    headers.append(
      "Set-Cookie",
      `${dedupeCookieName}=1; Path=/r/${slug}; Max-Age=1800; SameSite=Lax; HttpOnly`
    );
  }

  // 5. Server-side redaction if hideContact is enabled
  const finalContent = link.hideContact
    ? redactContactDetails(resume.content)
    : resume.content;

  return Response.json(
    {
      locked: false,
      slug,
      title: resume.title,
      templateId: resume.templateId as TemplateId,
      content: finalContent,
      design: resume.design as ResumeDesign,
      allowDownload: link.allowDownload,
      noindex: link.noindex,
      hideContact: link.hideContact,
    },
    { headers }
  );
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const db = await getDatabase(env);
  const slug = params.slug;

  const link = await getRawShareLinkBySlug(db, slug);
  const status = getPublicShareStatus(link);

  if (status === "unavailable" || !link) {
    throw new Response("This link is unavailable", { status: 404 });
  }

  const formData = await request.formData();
  const password = (formData.get("password") as string) || "";

  // Rate limiting check by IP
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "client-ip";
  const rateLimitKey = `${clientIp}:${slug}`;

  if (!checkRateLimit(rateLimitKey)) {
    return Response.json(
      { ok: false, error: "Too many attempts. Please try again in 1 minute." },
      { status: 429 }
    );
  }

  // Constant-time password verify
  const isValid = await verifySharePassword(password, link.passwordHash || "");
  if (!isValid) {
    return Response.json(
      { ok: false, error: "Incorrect password. Please try again." },
      { status: 400 }
    );
  }

  // Issue signed unlock cookie (24h)
  const secret =
    env?.SHARE_COOKIE_SECRET ||
    env?.BETTER_AUTH_SECRET ||
    (typeof process !== "undefined" ? process.env?.BETTER_AUTH_SECRET : undefined) ||
    "fallback-secret";
  const isProduction = Boolean(
    env?.ENVIRONMENT === "production" || env?.NODE_ENV === "production"
  );
  const token = await createUnlockToken(slug, link.passwordHash || "", secret);
  const cookieHeader = serializeUnlockCookie(slug, token, isProduction);

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    }
  );
}

export default function PublicResumePage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();

  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Print pipeline for allowed PDF downloads
  const content = data?.content || ({ personal: {} } as any);
  const candidateName =
    content?.personal?.fullName ||
    content?.personal?.name ||
    (data as any)?.title ||
    "Resume";
  const {
    isPrinting,
    showHintDialog,
    setShowHintDialog,
    dontShowAgain,
    setDontShowAgain,
    triggerPrint,
    confirmPrint,
  } = usePrintResume({
    content,
    title: candidateName,
  });

  React.useEffect(() => {
    if (fetcher.data?.ok) {
      window.location.reload();
    }
  }, [fetcher.data]);

  if (data.locked) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-between p-4">
        <header className="py-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-foreground">
            <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
              R
            </span>
            <span>Resumint</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Protected Resume
              </h1>
              <p className="text-xs text-muted-foreground">
                This document is password-protected by the author. Enter the password below to view.
              </p>
            </div>

            <fetcher.Form method="post" className="space-y-4 text-left">
              <input type="hidden" name="intent" value="unlock" />
              <div className="space-y-1.5">
                <Label htmlFor="public-unlock-password" className="text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="public-unlock-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="pr-10 text-sm font-mono"
                    data-testid="public-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {fetcher.data?.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-destructive text-xs"
                  data-testid="unlock-error-message"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{fetcher.data.error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                size="sm"
                disabled={fetcher.state !== "idle" || !passwordInput}
                data-testid="unlock-submit-button"
              >
                <span>Unlock Resume</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </fetcher.Form>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-muted-foreground">
          Built with <Link to="/" className="text-foreground hover:underline">Resumint</Link>
        </footer>
      </div>
    );
  }

  // Unlocked Public State
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex flex-col justify-between selection:bg-primary/20">
      {/* Best-effort print suppression when allowDownload is false */}
      {!data.allowDownload && (
        <style data-testid="print-suppression-style">{`
          @media print {
            #public-resume-document {
              display: none !important;
            }
            body::after {
              content: "Printing and PDF export have been disabled for this document by the author.";
              display: block;
              text-align: center;
              font-family: sans-serif;
              padding: 4rem 2rem;
              font-size: 1.1rem;
              color: #666;
            }
          }
        `}</style>
      )}

      {/* Slim Top Bar */}
      <header className="border-b bg-background/95 backdrop-blur-xs px-4 py-2.5 sticky top-0 z-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="h-6 w-6 rounded bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
              R
            </span>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">Resumint</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
            {candidateName}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {data.allowDownload && (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={triggerPrint}
              disabled={isPrinting}
              className="gap-1.5 h-8 text-xs shadow-xs"
              data-testid="public-download-pdf-button"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </Button>
          )}

          <Link to="/build">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden md:inline-flex">
              <Sparkles className="h-3 w-3" />
              <span>Create Your Own</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Document View Canvas */}
      <main className="flex-1 flex justify-center items-start p-2 sm:p-6 lg:p-8 overflow-x-hidden">
        <div
          id="public-resume-document"
          className="w-full flex justify-center max-w-full"
          data-testid="public-resume-preview"
        >
          <PrintRoot design={data.design as any}>
            <ResumePreview
              content={data.content as any}
              design={data.design as any}
              templateId={data.templateId}
            />
          </PrintRoot>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t bg-background/80 py-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4">
        <span>Made with Resumint • Free ATS Resume Builder</span>
        <span className="hidden sm:inline">•</span>
        <Link to="/" className="text-foreground hover:underline font-medium">
          Create a free resume
        </Link>
      </footer>

      {/* Print Hint Dialog */}
      <PrintHintDialog
        open={showHintDialog}
        onOpenChange={setShowHintDialog}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onConfirm={confirmPrint}
      />
    </div>
  );
}

/**
 * Uniform 404 Unavailable Boundary
 * Indistinguishable for not_found, revoked, or expired share links.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-between p-4 selection:bg-primary/20">
      <header className="py-4 text-center">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-foreground">
          <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
            R
          </span>
          <span>Resumint</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="unavailable-heading">
              This link is unavailable
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The resume you are looking for does not exist, has expired, or the link was turned off by the author.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/build">
              <Button size="sm" className="gap-2">
                <span>Create Your Own Resume</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Built with <Link to="/" className="text-foreground hover:underline">Resumint</Link>
      </footer>
    </div>
  );
}
