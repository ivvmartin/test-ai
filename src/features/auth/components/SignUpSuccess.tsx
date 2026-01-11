"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Image from "next/image";

import { Button } from "@components/ui/button";
import { ProductCard } from "./ProductCard";

interface SignUpSuccessProps {
  registeredEmail: string;
  apiError: string | null;
  resendCooldown: number;
  isResending: boolean;
  onResendEmail: () => void;
}

export function SignUpSuccess({
  registeredEmail,
  apiError,
  resendCooldown,
  isResending,
  onResendEmail,
}: SignUpSuccessProps) {
  return (
    <div className="flex h-screen">
      {/* Left-end side - Product Card */}
      <div className="hidden lg:block lg:w-[40%] xl:w-[45%] p-6">
        <div className="h-full w-full rounded-xl overflow-hidden">
          <ProductCard />
        </div>
      </div>

      {/* Right side - Success Content */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Brand Logo and Slogan */}
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-4">
              <div className="relative h-28 w-28 flex-shrink-0">
                <Image
                  src="/brand-light.png"
                  alt="EVTA AI Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="h-10 w-px bg-neutral-300" />
              <span className="text-sm font-semibold text-neutral-700">
                Вашият данъчен партньор
              </span>
            </div>
          </div>

          <div className="text-center">
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
                onClick={onResendEmail}
                disabled={resendCooldown > 0 || isResending}
                variant="outline"
                className="w-full h-12 rounded-full"
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
