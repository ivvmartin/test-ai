"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "@/lib/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

type SetNewPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export default function SetNewPassword() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState } =
    useForm<SetNewPasswordFormData>({
      mode: "onChange",
      defaultValues: {
        password: "",
        confirmPassword: "",
      },
    });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data: SetNewPasswordFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setApiError(
          error.message || "Failed to reset password. Please try again"
        );
        return;
      }

      toast.success(
        "Password reset successful! You can now sign in with your new password"
      );
      setTimeout(() => {
        navigate("/auth/sign-in");
      }, 1500);
    } catch (error) {
      console.error("Set new password error:", error);
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Set new password
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your new password below
            </p>
          </div>

          {/* Set New Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {apiError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
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
              <Label htmlFor="confirmPassword">Confirm new password</Label>
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
              {isLoading ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
