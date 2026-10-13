import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/sonner";
import { signIn, signUp } from "~/auth/auth.client";
import { safeRedirect } from "~/auth/redirect";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "~/lib/schemas/auth";

export interface AuthFormProps {
  mode: "signin" | "signup";
  redirectTo?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

type FormData = SignUpInput; // superset of SignInInput

export function AuthForm({
  mode: initialMode,
  redirectTo,
  onSuccess,
  compact = false,
}: AuthFormProps) {
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const isSignUp = mode === "signup";
  const targetRedirect = safeRedirect(redirectTo, "/dashboard");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: async (values) => {
      const schema = isSignUp ? signUpSchema : signInSchema;
      const result = await schema.safeParseAsync(values);

      if (result.success) {
        return { values: result.data as FormData, errors: {} };
      }

      const formErrors: Record<string, { type: string; message: string }> = {};
      for (const issue of result.error.issues) {
        const fieldName = (issue.path[0]?.toString() || "root") as string;
        if (!formErrors[fieldName]) {
          formErrors[fieldName] = {
            type: issue.code,
            message: issue.message,
          };
        }
      }

      return { values: {}, errors: formErrors };
    },
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Switch modes if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setServerError(null);
  }, [initialMode]);

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    try {
      if (isSignUp) {
        const res = await signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
        });

        if (res.error) {
          const msg =
            res.error.message ||
            "Unable to create account. Please check your details and try again.";
          setServerError(msg);
          return;
        }

        toast.success("Account created successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(targetRedirect);
        }
      } else {
        const res = await signIn.email({
          email: data.email,
          password: data.password,
        });

        if (res.error) {
          setServerError("Invalid email or password");
          return;
        }

        toast.success("Signed in successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(targetRedirect);
        }
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again later.");
    }
  };

  const toggleMode = () => {
    setServerError(null);
    reset();
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
  };

  return (
    <div className={compact ? "w-full space-y-4" : "w-full max-w-md space-y-6"}>
      {/* Header if not compact */}
      {!compact && (
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Enter your details below to create your Resumint account"
              : "Enter your email and password to access your resumes"}
          </p>
        </div>
      )}

      {/* Accessible Server Error Alert */}
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
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        noValidate
        className="space-y-4"
        aria-label={isSignUp ? "Sign up form" : "Sign in form"}
      >
        {/* Name Field (Sign Up Only) */}
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">Full Name</Label>
            <Input
              id="auth-name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "auth-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p
                id="auth-name-error"
                role="alert"
                aria-live="polite"
                className="text-xs font-medium text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email Address</Label>
          <Input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="auth-email-error"
              role="alert"
              aria-live="polite"
              className="text-xs font-medium text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="auth-password">Password</Label>
            {!isSignUp && !compact && (
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={isSubmitting}
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "auth-password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
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
              id="auth-password-error"
              role="alert"
              aria-live="polite"
              className="text-xs font-medium text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp
            ? isSubmitting
              ? "Creating account..."
              : "Create Account"
            : isSubmitting
            ? "Signing in..."
            : "Sign In"}
        </Button>
      </form>

      {/* Switcher Footer */}
      <div className="text-center text-sm text-muted-foreground">
        {compact ? (
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        ) : isSignUp ? (
          <span>
            Already have an account?{" "}
            <Link
              to={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </span>
        ) : (
          <span>
            Don't have an account?{" "}
            <Link
              to={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
