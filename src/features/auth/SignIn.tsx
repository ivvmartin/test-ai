"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";

import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

interface SignInFormData {
  email: string;
  password: string;
}

export default function SignIn() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<SignInFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Handle Supabase auth errors
        let errorMessage = "We couldn't sign you in. Please try again";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password. Please try again";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address before signing in";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setApiError(errorMessage);
        return;
      }

      // Success - Supabase automatically sets cookies
      // The auth store will be updated via the onAuthStateChange listener
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl backdrop-blur-sm bg-white/90 p-10 md:p-12 shadow-xl border border-neutral-200">
          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Sign in to continue to your EVTA Consult workspace
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
              <Label htmlFor="email">Email address</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/reset-password"
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !formState.isValid}
            >
              {isLoading ? "Signing in..." : "Sign in"}
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

          {/* Create Account Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
