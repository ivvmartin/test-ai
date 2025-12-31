"use client";

import { Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Имейлът е задължителен")
      .regex(
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        "Невалиден имейл адрес"
      ),
    password: z
      .string()
      .min(1, "Паролата е задължителна")
      .min(8, "Паролата трябва да бъде поне 8 символа")
      .regex(/[a-z]/, "Паролата трябва да съдържа поне една малка буква")
      .regex(/[A-Z]/, "Паролата трябва да съдържа поне една главна буква")
      .regex(/[0-9]/, "Паролата трябва да съдържа поне една цифра"),
    confirmPassword: z.string().min(1, "Моля, потвърдете паролата си"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
  });

type SignUpFormInputs = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { register, handleSubmit, watch, formState } =
    useForm<SignUpFormInputs>({
      resolver: zodResolver(signUpSchema),
      mode: "onChange",
      defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
      },
    });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setApiError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setApiError(
          "Не успяхме да изпратим имейла отново. Моля, опитайте по-късно"
        );
      } else {
        toast.success("Имейлът е изпратен успешно");
        setResendCooldown(60);
      }
    } catch (error) {
      console.error("Resend email error:", error);
      setApiError("Възникна неочаквана грешка. Моля, опитайте отново");
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: SignUpFormInputs) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        let errorMessage =
          "Не успяхме да създадем вашия акаунт. Моля, опитайте отново";

        if (
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          errorMessage =
            "Този имейл вече е регистриран. Моля, влезте или използвайте друг имейл";
        } else if (error.message.includes("Password")) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setApiError(errorMessage);
        return;
      }

      if (
        signUpData?.user &&
        signUpData.user.identities &&
        signUpData.user.identities.length === 0
      ) {
        setApiError(
          "Този имейл вече е регистриран. Моля, влезте или използвайте друг имейл"
        );
        return;
      }

      setRegisteredEmail(data.email);
      setShowSuccess(true);
      setResendCooldown(60);
    } catch (error) {
      console.error("Sign up error:", error);
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

  if (showSuccess) {
    return (
      <div className="flex h-screen items-center justify-center p-4 pl-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-4">
                Проверете имейла си
              </h2>
              <p className="text-neutral-600 mb-2">
                Изпратихме имейл за потвърждение на:
              </p>
              <p className="font-semibold text-neutral-900 mb-6">
                {registeredEmail}
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                Кликнете на линка в имейла, за да потвърдите акаунта си и да
                завършите регистрацията
              </p>

              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mb-4"
                >
                  {apiError}
                </motion.div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-neutral-600">Не получихте имейл?</p>
                <Button
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  variant="outline"
                  className="w-full h-11"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isResending
                    ? "Изпращане..."
                    : resendCooldown > 0
                    ? `Изпрати отново (${resendCooldown}s)`
                    : "Изпрати отново"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Създайте акаунт
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Създайте вашия ЕВТА Консулт акаунт и започнете
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
              <Label htmlFor="email">Имейл адрес</Label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("email")}
                />
              </div>
              {formState.errors.email && (
                <p className="text-sm text-red-600">
                  {formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("password")}
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
              <Label htmlFor="confirmPassword">Потвърдете паролата</Label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  {...register("confirmPassword")}
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

              {formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {formState.errors.confirmPassword.message}
                </p>
              )}
              {!formState.errors.confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600">✓ Паролите съвпадат</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid || !passwordsMatch}
            >
              {isLoading ? "Създаване на акаунт..." : "Създай акаунт"}
            </Button>

            <p className="text-center text-xs text-neutral-500 pt-2">
              Продължавайки, вие се съгласявате с нашите{" "}
              <a href="/legal#tos" className="underline hover:text-neutral-700">
                Общи условия
              </a>{" "}
              и{" "}
              <a href="/legal#pp" className="underline hover:text-neutral-700">
                Политика за поверителност
              </a>
            </p>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Вече имате акаунт?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Влезте
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
