"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductCard } from "./components/ProductCard";
import { SignUpSuccess } from "./components/SignUpSuccess";

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
      <SignUpSuccess
        registeredEmail={registeredEmail}
        apiError={apiError}
        resendCooldown={resendCooldown}
        isResending={isResending}
        onResendEmail={handleResendEmail}
      />
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left-end side - Product Card */}
      <div className="hidden lg:block lg:w-[40%] xl:w-[45%] p-6">
        <div className="h-full w-full rounded-xl overflow-hidden">
          <ProductCard />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Brand Logo and Slogan */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3 mb-12">
              <Image
                src="/brand-light.png"
                alt="EVTA AI Logo"
                width={96}
                height={96}
                className="flex-shrink-0 object-contain"
                priority
              />
              <div className="h-8 w-px bg-neutral-300" />
              <span className="text-sm font-semibold text-neutral-700">
                Вашият данъчен партньор
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Създайте акаунт
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Създайте вашия EVTA AI акаунт и започнете да получавате бързо и
              лесно данъчни консултации
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {apiError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
                >
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="h-12 w-full mt-1"
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="text-sm text-red-600">
                  {formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 w-full mt-1"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
                  <div className="grid grid-cols-2 gap-1 text-xs">
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
                      ✓ Малка буква
                    </div>
                    <div
                      className={
                        passwordStrength.hasUppercase
                          ? "text-green-600"
                          : "text-neutral-500"
                      }
                    >
                      ✓ Главна буква
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
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 w-full mt-1"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
              className="h-12 w-full rounded-full text-base font-medium mt-4"
              disabled={isLoading || !formState.isValid || !passwordsMatch}
            >
              {isLoading ? "Създаване на акаунт..." : "Създай акаунт"}
            </Button>

            <p className="pt-2 text-center text-xs text-neutral-500">
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

          {/* Login Link */}
          <div className="mt-5">
            <Separator className="mb-4" />
            <p className="text-center text-sm text-neutral-600">
              Вече имате акаунт?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-primary hover:underline"
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
