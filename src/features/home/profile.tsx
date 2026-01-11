"use client";

import { useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth.store";
import { queryClient } from "@/utils/queries";
import { useUsageSnapshot } from "@/utils/usage-queries";
import { motion } from "framer-motion";
import { LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { DeleteAccountDialog } from "./components/DeleteAccountDialog";

export function Profile() {
  const navigate = useNavigate();
  const supabase = createClient();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: usage } = useUsageSnapshot();
  const hasActiveSubscription = usage?.planKey === "PAID";

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Неуспешен изход. Моля, опитайте отново");
        return;
      }
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
      toast.success("Излязохте успешно");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
      toast.error("Неуспешен изход. Моля, опитайте отново");
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Неправилна парола");
          throw new Error("Неправилна парола. Моля, опитайте отново");
        }

        throw new Error(data.error || "Неуспешно изтриване на акаунта");
      }

      await supabase.auth.signOut();
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
      toast.success("Вашият акаунт е изтрит окончателно");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Неуспешно изтриване на акаунта. Моля, опитайте отново"
      );
      throw error;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">Профил</h1>
          <p className="text-muted-foreground text-[15px] mt-1">
            Управлявайте настройките и предпочитанията на вашия акаунт
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm md:text-base">Изход</h3>
              <p className="text-muted-foreground text-sm">
                Ще трябва да влезете отново, за да получите достъп до акаунта си
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 shrink-0"
            >
              <LogOut className="size-4" />
              Изход
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm md:text-base">
                Изтриване на акаунт
              </h3>
              <p className="text-muted-foreground text-sm">
                Това действие не може да бъде отменено. Това ще изтрие
                окончателно вашия акаунт и ще премахне всички ваши данни от
                нашите сървъри
                {hasActiveSubscription &&
                  " Вашият активен абонамент ще бъде АНУЛИРИРАН незабавно"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 className="size-4" />
              Изтрий акаунт
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        hasActiveSubscription={hasActiveSubscription}
        onConfirm={handleDeleteAccount}
        isPending={isDeletingAccount}
      />
    </div>
  );
}
