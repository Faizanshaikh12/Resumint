import * as React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { forgetPassword } from "~/auth/auth.client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "~/lib/schemas/auth";

export function meta() {
  return [
    { title: "Forgot Password | Resumint" },
    { name: "description", content: "Reset your Resumint account password." },
  ];
}

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: async (values) => {
      const result = await forgotPasswordSchema.safeParseAsync(values);
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
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    try {
      await forgetPassword({
        email: data.email,
        redirectTo: "/reset-password",
      });
      // Always show generic success message to prevent user enumeration
      setSubmitted(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/80 dark:text-green-200"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Instructions sent</p>
                <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                  If an account exists for this email, password reset instructions have been generated.
                  (In local development, the reset link is logged to the console).
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
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
              aria-label="Forgot password form"
            >
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username email"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "forgot-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="forgot-email-error"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-medium text-destructive"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
