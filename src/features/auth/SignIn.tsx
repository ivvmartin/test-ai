"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { ProductCard } from "./components/ProductCard";

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Имейлът е задължителен")
    .regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Невалиден имейл адрес"),
  password: z
    .string()
    .min(1, "Паролата е задължителна")
    .min(8, "Паролата трябва да бъде поне 8 символа"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const confirmed = params.get("confirmed");
      const error = params.get("error");

      if (confirmed === "true") {
        toast.success(
          "Имейлът е потвърден успешно! Моля, влезте с вашите данни"
        );
        window.history.replaceState({}, "", "/auth/sign-in");
      } else if (error) {
        setApiError(decodeURIComponent(error));
        window.history.replaceState({}, "", "/auth/sign-in");
      }
    }
  }, []);

  const onSubmit = async (data: SignInFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        let errorMessage = "Не успяхме да ви впишем. Моля, опитайте отново";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Невалиден имейл или парола. Моля, опитайте отново";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Моля, потвърдете имейл адреса си преди да влезете";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setApiError(errorMessage);
        return;
      }

      reset();
      navigate("/app/chat");
    } catch (error) {
      console.error("Sign in error:", error);
      setApiError("An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left-end side - Product Card */}
      <div className="hidden lg:block lg:w-[40%] xl:w-[45%] p-6">
        <div className="h-full w-full rounded-xl overflow-hidden">
          <ProductCard />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-8 lg:w-[60%] lg:px-16 xl:w-[55%] xl:px-24">
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
              Влезте в EVTA AI
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Влезте в акаунта си, за да продължите
            </p>
          </div>

          {/* Sign In Form */}
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
                  autoComplete="current-password"
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
              {formState.errors.password && (
                <p className="text-sm text-red-600">
                  {formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/reset-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Забравена парола?
              </Link>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-medium"
              disabled={isLoading || !formState.isValid}
            >
              {isLoading ? "Влизане..." : "Вход"}
            </Button>

            <p className="pt-4 text-center text-xs text-neutral-500">
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

          {/* Registration Link */}
          <div className="mt-5">
            <Separator className="mb-4" />
            <p className="text-center text-sm text-neutral-600">
              Нямате регистрация?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-primary hover:underline"
              >
                Създайте акаунт
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
