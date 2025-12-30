"use client";

import { useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth.store";
import { queryClient } from "@/utils/queries";
import { useUsageSnapshot } from "@/utils/usage-queries";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";

export function Profile() {
  const navigate = useNavigate();
  const supabase = createClient();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: usage } = useUsageSnapshot();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Неуспешен изход. Моля, опитайте отново");
        return;
      }
      clearAuth();
      queryClient.clear();
      toast.success("Излязохте успешно");
      navigate("/auth/sign-in");
    } catch (error) {
      toast.error("Неуспешен изход. Моля, опитайте отново");
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (usage?.planKey === "PAID") {
      toast.error("Абонаментът ви е активен", {
        description:
          "Абонаментът ви не трябва да е активен, за да изтриете акаунта си",
      });
      return;
    }

    if (!confirmPassword.trim()) {
      setPasswordError(
        "Паролата е задължителна за потвърждаване на изтриването на акаунта"
      );
      return;
    }

    if (confirmPassword.length < 8) {
      setPasswordError("Паролата трябва да бъде поне 8 символа");
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setPasswordError("Неправилна парола. Моля, опитайте отново");
          toast.error("Неправилна парола");
          return;
        }

        throw new Error(data.error || "Неуспешно изтриване на акаунта");
      }

      toast.success("Вашият акаунт е изтрит окончателно");

      handleDialogClose();

      await supabase.auth.signOut();
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Неуспешно изтриване на акаунта. Моля, опитайте отново"
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordError("");
  };

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">Профил</h1>
          <p className="text-muted-foreground">
            Управлявайте настройките и предпочитанията на вашия акаунт
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Изход</h3>
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
              <h3 className="font-semibold text-base">Изтриване на акаунт</h3>
              <p className="text-muted-foreground text-sm">
                Това действие е необратимо и ще изтрие окончателно вашия акаунт
                и всички свързани данни
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-left">
                Изтриване на акаунт
              </DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Това действие не може да бъде отменено. Това ще изтрие окончателно
              вашия акаунт и ще премахне всички ваши данни от нашите сървъри
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Въведете паролата си за потвърждение
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Въведете вашата парола"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? "Скрий паролата" : "Покажи паролата"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Отказ
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || !confirmPassword.trim()}
              className="flex-1 gap-2"
            >
              {isDeletingAccount ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Изтриване...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Изтрий акаунт
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
