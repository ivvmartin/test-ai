"use client";

import { useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
          error.message || "Неуспешно нулиране на парола. Моля, опитайте отново"
        );
        return;
      }

      toast.success(
        "Паролата ви беше успешно нулирана. Пренасочваме ви към вашия акаунт..."
      );
      setTimeout(() => {
        navigate("/auth/sign-in");
      }, 1500);
    } catch (error) {
      console.error("Set new password error:", error);
      setApiError("Възникна неочаквана грешка. Моля, опитайте отново");
    } finally {
      setIsLoading(false);
    }
  };

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
              Задайте нова парола
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Въведете новата си парола по-долу
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
              <Label htmlFor="password">Нова парола</Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("password", {
                    required: "Паролата е задължителна",
                    minLength: {
                      value: 8,
                      message: "Паролата трябва да бъде поне 8 символа",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={showPassword ? "Скрий парола" : "Покажи парола"}
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
                      ✓ Поне 8 символа
                    </div>
                    <div
                      className={
                        passwordStrength.hasLowercase
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ Една малка буква
                    </div>
                    <div
                      className={
                        passwordStrength.hasUppercase
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ Една главна буква
                    </div>
                    <div
                      className={
                        passwordStrength.hasNumber
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ Една цифра
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Потвърдете новата парола</Label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("confirmPassword", {
                    required: "Моля, потвърдете паролата си",
                    validate: (value) =>
                      value === password || "Паролите не съвпадат",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={
                    showConfirmPassword ? "Скрий парола" : "Покажи парола"
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
                <p className="text-xs text-green-600">✓ Паролите съвпадат</p>
              )}
              {passwordsDontMatch && (
                <p className="text-xs text-red-600">✗ Паролите не съвпадат</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid || !passwordsMatch}
            >
              {isLoading ? "Нулиране на парола..." : "Нулирай парола"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
