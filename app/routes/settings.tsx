import React, { useState } from "react";
import { Link, Form, useNavigation, useActionData } from "react-router";
import type { Route } from "./+types/settings";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { getUserAccountStats, deleteUserAccount } from "~/db/queries/users";
import { verifyCsrf } from "~/lib/security/csrf.server";
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
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Download,
  LogOut,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export function meta() {
  return [
    { title: "Account Settings | Resumint" },
    { name: "description", content: "Manage your Resumint account, data export, and privacy settings." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const stats = await getUserAccountStats(db, user.id);

  return {
    user,
    stats: stats ?? {
      email: user.email,
      name: user.name,
      createdAt: new Date(),
      resumeCount: 0,
    },
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  verifyCsrf(request);
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete_account") {
    const confirmation = String(formData.get("confirmation") || "").trim().toLowerCase();
    if (confirmation !== "delete my account") {
      return { error: "Please type 'delete my account' to confirm deletion." };
    }

    // Permanently delete user and cascade all records
    await deleteUserAccount(db, user.id);

    // Clear Better Auth session cookie and redirect to home
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );
    headers.set("Location", "/?deleted=true");

    return new Response(null, {
      status: 302,
      headers,
    });
  }

  return { error: "Unknown action" };
}

export default function SettingsPage({
  loaderData,
}: {
  loaderData: {
    user: { id: string; email: string; name: string };
    stats: { email: string; name: string; createdAt: Date | string; resumeCount: number };
  };
}) {
  const { user, stats } = loaderData;
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("intent") === "delete_account";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const formattedDate = new Date(stats.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
      <div className="mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your personal details, data export, and account lifecycle.
        </p>
      </div>

      <div className="space-y-8">
        {/* Account Details Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <div className="font-medium text-foreground">{user.name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <div className="font-medium text-foreground">{user.email}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Member Since
              </Label>
              <div className="text-muted-foreground">{formattedDate}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Active Resumes</Label>
              <div className="text-muted-foreground">{stats.resumeCount} documents</div>
            </div>
          </div>
        </div>

        {/* Data Portability Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download Your Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Download a portable, single-file JSON backup containing all your resumes, section contents,
            and design styling in standard Resumint envelope format.
          </p>
          <a href="/api/export-data" download>
            <Button variant="outline" size="sm" className="gap-2 font-medium" data-testid="download-all-data-button">
              <Download className="h-4 w-4" /> Download all my data (JSON)
            </Button>
          </a>
        </div>

        {/* Session Management Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <LogOut className="h-5 w-5 text-muted-foreground" />
            Session Management
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Log out of your current session on this device.
          </p>
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Log out of this device
            </Button>
          </Form>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-xs">
          <h2 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
            Permanently delete your account and all associated resumes, version snapshots, and public
            share links. This action cannot be undone.
          </p>

          {actionData?.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionData.error}</span>
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            data-testid="open-delete-account-dialog-button"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <DialogTitle className="text-destructive">Permanently Delete Account?</DialogTitle>
            </div>
            <DialogDescription className="space-y-2 pt-2 text-sm">
              <span className="block">
                This will immediately and permanently erase your account (<strong>{user.email}</strong>),
                all <strong>{stats.resumeCount}</strong> resumes, their version histories, and all public
                share links. Anyone with an existing share link will receive a 404 page.
              </span>
              <span className="block font-semibold text-foreground">
                To confirm, type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">delete my account</span> below:
              </span>
            </DialogDescription>
          </DialogHeader>

          <Form method="post" className="space-y-4 pt-2">
            <input type="hidden" name="intent" value="delete_account" />
            <div className="space-y-2">
              <Label htmlFor="confirmation-input" className="sr-only">
                Confirmation Phrase
              </Label>
              <Input
                id="confirmation-input"
                name="confirmation"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="delete my account"
                autoComplete="off"
                data-testid="delete-account-confirmation-input"
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setConfirmInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={confirmInput.trim().toLowerCase() !== "delete my account" || isDeleting}
                data-testid="confirm-delete-account-button"
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Permanently Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
