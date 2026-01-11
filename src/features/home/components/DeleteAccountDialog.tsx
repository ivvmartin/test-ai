import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";

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

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveSubscription: boolean;
  onConfirm: (password: string) => Promise<void>;
  isPending: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  hasActiveSubscription,
  onConfirm,
  isPending,
}: DeleteAccountDialogProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordError("");
  };

  const handleConfirm = async () => {
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

    try {
      await onConfirm(confirmPassword);
      handleClose();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Неправилна парола")
      ) {
        setPasswordError("Неправилна парола. Моля, опитайте отново");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-left">Изтриване на акаунт</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-2" asChild>
            <div>
              <span className="block">
                Това действие не може да бъде отменено. Това ще изтрие
                окончателно вашия акаунт и ще премахне всички ваши данни от
                нашите сървъри.
              </span>
              {hasActiveSubscription && (
                <span className="block font-semibold text-destructive">
                  Вашият активен абонамент ще бъде АНУЛИРИРАН незабавно
                </span>
              )}
            </div>
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
                aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
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
            onClick={handleConfirm}
            disabled={isPending || !confirmPassword.trim()}
            className="flex-1 gap-2"
          >
            {isPending ? (
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
  );
}
