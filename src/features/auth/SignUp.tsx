"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

type SignUpFormInputs = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUp() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const { register, handleSubmit, watch, formState } =
    useForm<SignUpFormInputs>({
      mode: "onChange",
      defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
      },
    });

  const email = watch("email");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data: SignUpFormInputs) => {
    setApiError(null);
    setIsLoading(false);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        let errorMessage = "We couldn't create your account. Please try again";

        if (error.message.includes("already registered")) {
          errorMessage =
            "This email is already registered. Please sign in or use a different email";
        } else if (error.message.includes("Password")) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setApiError(errorMessage);
        return;
      }

      // Success - show confirmation message
      setRegisteredEmail(data.email);
      setShowSuccess(true);
    } catch (error) {
      console.error("Sign up error:", error);
      setApiError("An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const passwordStrength = {
    hasMinLength: password?.length >= 8,
    hasLowercase: /[a-z]/.test(password || ""),
    hasUppercase: /[A-Z]/.test(password || ""),
    hasNumber: /[0-9]/.test(password || ""),
  };

  const strengthCount = Object.values(passwordStrength).filter(Boolean).length;

  const passwordsMatch =
    password &&
    confirmPassword &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordsDontMatch =
    confirmPassword &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  // Show success message if signup was successful
  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-4">
                Check your email
              </h2>
              <p className="text-neutral-600 mb-2">
                We&apos;ve sent a confirmation email to:
              </p>
              <p className="font-semibold text-neutral-900 mb-6">
                {registeredEmail}
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                Click the link in the email to verify your account and complete
                your signup
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Create your EVTA Consult account and get started
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
              >
                {apiError}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && password.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strengthCount >= level
                            ? strengthCount === 4
                              ? "bg-green-500"
                              : strengthCount === 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div
                      className={
                        passwordStrength.hasMinLength
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ At least 8 characters
                    </div>
                    <div
                      className={
                        passwordStrength.hasLowercase
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ One lowercase letter
                    </div>
                    <div
                      className={
                        passwordStrength.hasUppercase
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ One uppercase letter
                    </div>
                    <div
                      className={
                        passwordStrength.hasNumber
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ One number
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords don't match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {passwordsMatch && (
                <p className="text-xs text-green-600">✓ Passwords match</p>
              )}
              {passwordsDontMatch && (
                <p className="text-xs text-red-600">
                  ✗ Passwords don&apos;t match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid || !passwordsMatch}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-xs text-neutral-500 pt-2">
              By continuing, you agree to our{" "}
              <a href="/legal#tos" className="underline hover:text-neutral-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/legal#pp" className="underline hover:text-neutral-700">
                Privacy Policy
              </a>
            </p>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
