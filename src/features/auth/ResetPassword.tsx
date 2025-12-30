"use client";

import { Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

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

  const { register, handleSubmit, watch, formState } =
    useForm<ResetPasswordFormData>({
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
    <div className="flex h-screen items-center justify-center p-4 pl-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Нулиране на парола
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Въведете имейл адреса си и ще ви изпратим линк за нулиране на
              паролата
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid || emailSent}
            >
              {isLoading
                ? "Изпращане..."
                : emailSent
                ? "Имейлът е изпратен!"
                : "Изпрати линк за нулиране"}
            </Button>
          </form>

          {/* Back to Sign In Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Спомнихте си паролата?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Влезте оттук
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
