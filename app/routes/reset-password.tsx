import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/sonner";
import { resetPassword } from "~/auth/auth.client";
import { resetPasswordSchema, type ResetPasswordInput } from "~/lib/schemas/auth";

export function meta() {
  return [
    { title: "Reset Password | Resumint" },
    { name: "description", content: "Set a new password for your Resumint account." },
  ];
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: async (values) => {
      const result = await resetPasswordSchema.safeParseAsync(values);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      const formErrors: Record<string, { type: string; message: string }> = {};
      for (const issue of result.error.issues) {
        formErrors[issue.path[0]?.toString() || "root"] = {
          type: issue.code,
          message: issue.message,
        };
      }
      return { values: {}, errors: formErrors };
    },
    defaultValues: { password: "" },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setServerError("Reset token is missing or invalid. Please request a new link.");
      return;
    }

    setServerError(null);
    try {
      const res = await resetPassword({
        newPassword: data.password,
        token,
      });

      if (res?.error) {
        setServerError(res.error.message || "Failed to reset password. Link may have expired.");
        return;
      }

      toast.success("Password reset successfully");
      navigate("/login");
    } catch {
      setServerError("An error occurred while resetting password. Please try again.");
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Set New Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        {!token && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Missing password reset token. Please request a new link.</span>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
          aria-label="Reset password form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New Password</Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isSubmitting || !token}
                className="pr-10"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "reset-password-error" : undefined}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || !token}
                className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="reset-password-error"
                role="alert"
                aria-live="polite"
                className="text-xs font-medium text-destructive"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-medium"
            disabled={isSubmitting || !token}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
          >
            Cancel and return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
