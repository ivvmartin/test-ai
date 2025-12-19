"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/lib/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

type ResetPasswordFormData = {
  email: string;
};

export default function ResetPassword() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, watch, formState } =
    useForm<ResetPasswordFormData>({
      mode: "onChange",
      defaultValues: {
        email: "",
      },
    });

  const email = watch("email");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset`,
      });

      if (error) {
        toast.error("Failed to send reset email. Please try again");
        return;
      }

      setEmailSent(true);
      toast.success(
        "Check your email! If an account exists with this email, you&apos;ll receive a password reset link shortly"
      );
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid || emailSent}
            >
              {isLoading
                ? "Sending..."
                : emailSent
                ? "Email sent!"
                : "Send reset link"}
            </Button>
          </form>

          {/* Back to Sign In Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Remember your password?{" "}
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
