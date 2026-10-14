import React, { useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/resumes.$id.share";
import {
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink,
  QrCode,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { requireUser } from "~/auth/helpers.server";
import { verifyCsrf } from "~/lib/security/csrf.server";
import { getDatabase } from "~/db/helpers.server";
import { getResume } from "~/db/queries/resumes";
import {
  getShareLinkByResumeId,
  upsertShareLink,
  revokeShareLink,
  deleteShareLink,
  regenerateSlug,
  countActiveShareLinks,
  type OwnerShareLink,
} from "~/db/queries/shares";
import {
  calculateExpiryTimestamp,
  formatExpiryRemaining,
  type ExpiryPreset,
} from "~/lib/share/expiry";
import {
  hashSharePassword,
  validateSharePassword,
} from "~/lib/share/password";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { QrCodeDialog } from "~/components/share/QrCodeDialog";
import { toast } from "~/components/ui/sonner";

export const MAX_ACTIVE_SHARE_LINKS_PER_USER = 10;

export function meta() {
  return [
    { title: "Share Settings | Resumint" },
    { name: "description", content: "Manage public link, privacy, and password protection settings for your resume." },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const resume = await getResume(db, user.id, params.id);
  if (!resume) {
    throw new Response("Resume not found", { status: 404 });
  }

  const share = await getShareLinkByResumeId(db, user.id, params.id);
  const activeCount = await countActiveShareLinks(db, user.id);

  return {
    resumeId: resume.id,
    resumeTitle: resume.title,
    share: share
      ? {
          ...share,
          expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
        }
      : null,
    maxActiveLinks: MAX_ACTIVE_SHARE_LINKS_PER_USER,
    activeLinksCount: activeCount,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  verifyCsrf(request);
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const resume = await getResume(db, user.id, params.id);
  if (!resume) {
    throw new Response("Resume not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // 1. Enable Share Link
  if (intent === "enable") {
    const existing = await getShareLinkByResumeId(db, user.id, params.id);
    if (!existing || !existing.enabled) {
      const activeCount = await countActiveShareLinks(db, user.id);
      if (activeCount >= MAX_ACTIVE_SHARE_LINKS_PER_USER) {
        return Response.json(
          {
            ok: false,
            error: `Maximum active share links reached (${MAX_ACTIVE_SHARE_LINKS_PER_USER}). Turn off sharing on an existing resume to activate this one.`,
          },
          { status: 400 }
        );
      }
    }

    const created = await upsertShareLink(db, user.id, params.id, {
      allowDownload: true,
      noindex: true,
      hideContact: false,
    });

    return Response.json({ ok: true, message: "Share link enabled", share: created });
  }

  // 2. Disable Share Link
  if (intent === "disable") {
    await revokeShareLink(db, user.id, params.id);
    return Response.json({ ok: true, message: "Share link turned off" });
  }

  // 3. Update Permissions / Expiry
  if (intent === "update") {
    const allowDownload = formData.get("allowDownload") === "true";
    const noindex = formData.get("noindex") === "true";
    const hideContact = formData.get("hideContact") === "true";
    const expiryPreset = (formData.get("expiryPreset") as ExpiryPreset) || "never";
    const customDate = formData.get("customDate") as string | null;

    const expiryResult = calculateExpiryTimestamp(expiryPreset, customDate);
    if (!expiryResult.ok) {
      return Response.json({ ok: false, error: expiryResult.error }, { status: 400 });
    }

    const updated = await upsertShareLink(db, user.id, params.id, {
      allowDownload,
      noindex,
      hideContact,
      expiresAt: expiryResult.expiresAt,
    });

    return Response.json({ ok: true, message: "Settings saved", share: updated });
  }

  // 4. Set Password
  if (intent === "setPassword") {
    const password = (formData.get("password") as string) || "";
    const validation = validateSharePassword(password);
    if (!validation.ok) {
      return Response.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const hash = await hashSharePassword(password);
    await upsertShareLink(db, user.id, params.id, { passwordHash: hash });

    return Response.json({ ok: true, message: "Password protection set" });
  }

  // 5. Remove Password
  if (intent === "removePassword") {
    await upsertShareLink(db, user.id, params.id, { passwordHash: null });
    return Response.json({ ok: true, message: "Password removed" });
  }

  // 6. Regenerate Slug (old slug dies immediately)
  if (intent === "regenerate") {
    const updated = await regenerateSlug(db, user.id, params.id);
    return Response.json({
      ok: true,
      message: "New link generated. Previous link is permanently dead.",
      share: updated,
    });
  }

  // 7. Delete Share Link
  if (intent === "deleteLink") {
    await deleteShareLink(db, user.id, params.id);
    return Response.json({ ok: true, message: "Share link deleted" });
  }

  return Response.json({ ok: false, error: "Invalid intent" }, { status: 400 });
}

export default function ShareSettingsPage({ loaderData }: Route.ComponentProps) {
  const { resumeId, resumeTitle, share, maxActiveLinks, activeLinksCount } = loaderData;
  const fetcher = useFetcher<any>();
  const navigate = useNavigate();

  // Dialogs
  const [qrOpen, setQrOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Expiry custom input state
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>(
    share?.expiresAt ? "custom" : "never"
  );
  const [customDateInput, setCustomDateInput] = useState<string>(
    share?.expiresAt ? share.expiresAt.split("T")[0] || "" : ""
  );

  const [copied, setCopied] = useState(false);

  // Compute public full URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = share?.slug ? `${origin}/r/${share.slug}` : "";

  const isPending = fetcher.state !== "idle";

  // Flash toast messages on fetcher result
  React.useEffect(() => {
    if (fetcher.data?.ok && fetcher.data?.message) {
      toast.success(fetcher.data.message);
      if (passwordModalOpen) {
        setPasswordModalOpen(false);
        setPasswordInput("");
        setPasswordError(null);
      }
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
      if (passwordModalOpen) {
        setPasswordError(fetcher.data.error);
      }
    }
  }, [fetcher.data]);

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleToggleSharing = (enabled: boolean) => {
    fetcher.submit(
      { intent: enabled ? "enable" : "disable" },
      { method: "post" }
    );
  };

  const handleUpdateOption = (field: string, value: boolean) => {
    if (!share) return;
    fetcher.submit(
      {
        intent: "update",
        allowDownload: String(field === "allowDownload" ? value : share.allowDownload),
        noindex: String(field === "noindex" ? value : share.noindex),
        hideContact: String(field === "hideContact" ? value : share.hideContact),
        expiryPreset,
        customDate: customDateInput,
      },
      { method: "post" }
    );
  };

  const handleApplyExpiry = (preset: ExpiryPreset, customVal?: string) => {
    if (!share) return;
    setExpiryPreset(preset);
    fetcher.submit(
      {
        intent: "update",
        allowDownload: String(share.allowDownload),
        noindex: String(share.noindex),
        hideContact: String(share.hideContact),
        expiryPreset: preset,
        customDate: customVal !== undefined ? customVal : customDateInput,
      },
      { method: "post" }
    );
  };

  const handleSubmitPassword = () => {
    const val = validateSharePassword(passwordInput);
    if (!val.ok) {
      setPasswordError(val.error || "Invalid password");
      return;
    }
    fetcher.submit(
      { intent: "setPassword", password: passwordInput },
      { method: "post" }
    );
  };

  const handleRemovePassword = () => {
    fetcher.submit({ intent: "removePassword" }, { method: "post" });
  };

  const handleRegenerate = () => {
    setConfirmRegenOpen(false);
    fetcher.submit({ intent: "regenerate" }, { method: "post" });
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(false);
    fetcher.submit({ intent: "deleteLink" }, { method: "post" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link to={`/resumes/${resumeId}/edit`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Editor</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
            {resumeTitle}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-muted-foreground font-medium">
            Active Links: <strong className="text-foreground">{activeLinksCount}</strong> / {maxActiveLinks}
          </span>
        </div>
      </div>

      {/* Main Sharing Switch Card */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground" data-testid="share-settings-heading">
                Public Link Sharing
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this secret web link can view your formatted resume in their browser.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                share?.enabled
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
              data-testid="share-status-pill"
            >
              {share?.enabled ? "Sharing Active" : "Sharing Off"}
            </span>

            <Button
              type="button"
              variant={share?.enabled ? "outline" : "default"}
              size="sm"
              disabled={isPending}
              onClick={() => handleToggleSharing(!share?.enabled)}
              data-testid="public-share-switch"
              role="switch"
              aria-checked={Boolean(share?.enabled)}
            >
              {share?.enabled ? "Turn Off" : "Enable Link"}
            </Button>
          </div>
        </div>

        {/* Public URL Action Bar (When enabled) */}
        {share?.enabled && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-xs font-medium text-muted-foreground">
              Shareable Web Link
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                readOnly
                value={publicUrl}
                className="font-mono text-xs bg-muted/50 select-all"
                aria-label="Public resume URL"
                data-testid="public-link-input"
              />

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 flex-1 sm:flex-initial"
                  data-testid="copy-share-url-button"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>

                <a
                  href={`/r/${share.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial"
                >
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </Button>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQrOpen(true)}
                  className="gap-1.5 flex-1 sm:flex-initial"
                  data-testid="open-qr-dialog-button"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>QR Code</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Options & Privacy Settings (Visible when sharing is enabled) */}
      {share?.enabled && (
        <div className="grid gap-6">
          {/* Privacy Toggles */}
          <div className="rounded-xl border bg-card p-6 shadow-xs space-y-5">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Privacy & Permissions</span>
            </h3>

            <div className="space-y-4 divide-y">
              {/* Allow PDF Download */}
              <div className="flex items-start justify-between gap-4 pt-2 first:pt-0">
                <div className="space-y-0.5">
                  <Label htmlFor="toggle-pdf" className="text-sm font-medium cursor-pointer">
                    Allow PDF Download
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Displays a "Download PDF" button for visitors. When disabled, the button is hidden and print styles are blocked.
                  </p>
                </div>
                <input
                  id="toggle-pdf"
                  type="checkbox"
                  checked={share.allowDownload}
                  onChange={(e) => handleUpdateOption("allowDownload", e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 cursor-pointer"
                  data-testid="allow-download-switch"
                  role="switch"
                  aria-checked={Boolean(share.allowDownload)}
                />
              </div>

              {/* Hide Contact Info */}
              <div className="flex items-start justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="toggle-contact" className="text-sm font-medium cursor-pointer">
                    Hide Email & Phone Number
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Strips email address and telephone numbers server-side before sending data to visitors.
                  </p>
                </div>
                <input
                  id="toggle-contact"
                  type="checkbox"
                  checked={share.hideContact}
                  onChange={(e) => handleUpdateOption("hideContact", e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 cursor-pointer"
                  data-testid="hide-contact-switch"
                  role="switch"
                  aria-checked={Boolean(share.hideContact)}
                />
              </div>

              {/* Noindex Search Engines */}
              <div className="flex items-start justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="toggle-noindex" className="text-sm font-medium cursor-pointer">
                    Ask Search Engines Not to Index
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Emits <code className="text-[11px] bg-muted px-1 rounded">X-Robots-Tag: noindex</code> headers so Google and Bing do not list your public resume.
                  </p>
                </div>
                <input
                  id="toggle-noindex"
                  type="checkbox"
                  checked={share.noindex}
                  onChange={(e) => handleUpdateOption("noindex", e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 cursor-pointer"
                  data-testid="toggle-noindex"
                />
              </div>
            </div>
          </div>

          {/* Expiration Settings */}
          <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Link Expiration</span>
              </h3>

              <span className="text-xs font-medium text-muted-foreground" data-testid="expiry-status-text">
                {formatExpiryRemaining(share.expiresAt)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Set an automatic cut-off date after which the link will immediately return a 404 page.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(["never", "7d", "30d", "90d"] as ExpiryPreset[]).map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={expiryPreset === preset && !share.expiresAt ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyExpiry(preset)}
                  disabled={isPending}
                  className="text-xs h-8"
                  data-testid={`expiry-preset-${preset}`}
                >
                  {preset === "never" ? "Never" : preset === "7d" ? "7 Days" : preset === "30d" ? "30 Days" : "90 Days"}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Label htmlFor="custom-expiry-date" className="text-xs font-medium shrink-0">
                Or pick a date:
              </Label>
              <Input
                id="custom-expiry-date"
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="max-w-[180px] h-8 text-xs"
                data-testid="custom-expiry-input"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleApplyExpiry("custom", customDateInput)}
                disabled={!customDateInput || isPending}
                className="text-xs h-8"
                data-testid="apply-custom-expiry-button"
              >
                Apply Date
              </Button>
            </div>
          </div>

          {/* Password Protection */}
          <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Password Protection</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Require visitors to enter a password before viewing any resume details or candidate name.
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  share.hasPassword
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid="password-protection-badge"
              >
                {share.hasPassword ? "Password Protected" : "No Password"}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {share.hasPassword ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPasswordInput("");
                      setPasswordError(null);
                      setPasswordModalOpen(true);
                    }}
                    className="gap-1.5 text-xs"
                    data-testid="change-password-button"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Change Password</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePassword}
                    disabled={isPending}
                    className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                    data-testid="remove-password-button"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Remove Password</span>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPasswordInput("");
                    setPasswordError(null);
                    setPasswordModalOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                  data-testid="set-password-button"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Add Password Protection</span>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-xl border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Human Views
              </span>
              <div className="text-3xl font-extrabold text-foreground" data-testid="share-view-count">
                {share.viewCount}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Counts visits by people, not search engines or link previews; duplicate visits within 30 minutes are filtered.
              </p>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border max-w-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Live Document</span>
              </div>
              <p className="text-[11px]">
                Edits in the editor automatically appear on the public link without republishing.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-xs space-y-4">
            <h3 className="font-semibold text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Regenerate Link URL</p>
                <p className="text-xs text-muted-foreground">
                  Creates a completely new URL. Anyone with the old link will immediately see a 404 page.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmRegenOpen(true)}
                className="gap-1.5 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive shrink-0"
                data-testid="regenerate-slug-button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerate Link</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-destructive/10">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Delete Share Link</p>
                <p className="text-xs text-muted-foreground">
                  Permanently deletes this share configuration and all view statistics.
                </p>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                className="gap-1.5 text-xs shrink-0"
                data-testid="delete-share-link-button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Link</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      {share && (
        <QrCodeDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          url={publicUrl}
          title={resumeTitle}
        />
      )}

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1 text-primary">
              <Lock className="h-5 w-5" />
              <DialogTitle>
                {share?.hasPassword ? "Change Password" : "Set Share Password"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Visitors must enter this password to view your resume content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="share-password-input" className="text-xs font-medium">
                Password (6 to 128 characters)
              </Label>
              <div className="relative">
                <Input
                  id="share-password-input"
                  type={showPasswordText ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Enter a secret password"
                  className="pr-10 text-sm font-mono"
                  data-testid="share-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPasswordText ? "Hide password" : "Show password"}
                >
                  {showPasswordText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-destructive flex items-center gap-1.5" data-testid="password-error-message">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitPassword}
              disabled={isPending}
              data-testid="save-password-button"
            >
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Regenerate Slug Dialog */}
      <Dialog open={confirmRegenOpen} onOpenChange={setConfirmRegenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
              <DialogTitle>Regenerate Share Link?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              This will create a new secret URL for your resume. Anyone who bookmarked or received the old URL will immediately get a 404 error page.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmRegenOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRegenerate}
              data-testid="confirm-regenerate-button"
            >
              Yes, Generate New Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Link Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1 text-destructive">
              <Trash2 className="h-5 w-5" />
              <DialogTitle>Delete Share Link?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              This permanently removes the public link, password, and view counter. You can create a new link at any time.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              data-testid="confirm-delete-link-button"
            >
              Delete Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
