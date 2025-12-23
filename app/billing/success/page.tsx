"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@components/ui/button";
import { billingKeys } from "@utils/billing-queries";
import { usageKeys } from "@utils/usage-queries";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: billingKeys.status() });
    queryClient.invalidateQueries({ queryKey: usageKeys.snapshot() });
  }, [queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-14 w-14 text-green-600" />
          </div>
        </div>

        <h1 className="font-bold text-2xl">Добре дошли в Pro плана!</h1>
        <p className="text-muted-foreground">
          Вашият абонамент е активиран успешно. Вече имате достъп до всички
          премиум функции
        </p>

        <Button onClick={() => router.push("/app")} className="w-full">
          Започнете да използвате Pro →
        </Button>
      </div>
    </div>
  );
}
