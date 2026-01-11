"use client";

import { Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { ProductCard } from "./components/ProductCard";

const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Имейлът е задължителен")
    .regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Невалиден имейл адрес"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, formState } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset`,
      });

      if (error) {
        toast.error(
          "Неуспешно изпращане на имейл за нулиране. Моля, опитайте отново"
        );
        return;
      }

      setEmailSent(true);
      toast.success(
        "Проверете имейла си! Ако съществува акаунт с този имейл, ще получите линк за нулиране на паролата скоро"
      );
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Възникна неочаквана грешка. Моля, опитайте отново");
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
      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Brand Logo and Slogan */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image
                  src="/brand-light.png"
                  alt="EVTA AI Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="h-8 w-px bg-neutral-300" />
              <span className="text-sm font-semibold text-neutral-700">
                Вашият данъчен партньор
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Нулиране на парола
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Въведете имейл адреса си и ще ви изпратим линк за нулиране на
              паролата
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-medium mt-4"
              disabled={isLoading || !formState.isValid || emailSent}
            >
              {isLoading
                ? "Изпращане..."
                : emailSent
                ? "Имейлът е изпратен!"
                : "Изпрати линк за нулиране"}
            </Button>

            <div className="pt-4 text-center">
              <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-primary hover:underline"
              >
                ← Обратно към вход
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
