"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth.store";
import { useBillingStatus } from "@/utils/billing-queries";

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
  const { data: billingStatus } = useBillingStatus();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    const loadingToast = toast.loading("Signing out...");
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out. Please try again", {
          id: loadingToast,
        });
        return;
      }
      clearAuth();
      toast.success("Signed out successfully", { id: loadingToast });
      navigate("/auth/sign-in");
    } catch (error) {
      toast.error("Failed to sign out. Please try again", {
        id: loadingToast,
      });
      // Still navigate even on error since the local state should be cleared
      clearAuth();
      navigate("/auth/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Check if user has an active subscription
    if (
      billingStatus?.status === "active" ||
      billingStatus?.status === "trialing"
    ) {
      toast.error(
        "Please cancel your subscription before deleting your account",
        {
          description:
            "You need to cancel your active subscription first, then try again",
        }
      );
      return;
    }

    // Validate password is entered
    if (!confirmPassword.trim()) {
      setPasswordError("Password is required to confirm account deletion");
      return;
    }

    if (confirmPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    const loadingToast = toast.loading("Deleting your account...");
    setIsDeletingAccount(true);

    try {
      // Call the account deletion API endpoint
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          setPasswordError("Incorrect password. Please try again");
          toast.error("Incorrect password", { id: loadingToast });
          return;
        }

        throw new Error(data.error || "Failed to delete account");
      }

      // Success - account deleted
      toast.success("Your account has been permanently deleted", {
        id: loadingToast,
      });

      // Close dialog and sign out
      handleDialogClose();

      // Sign out and redirect to sign-in page
      await supabase.auth.signOut();
      clearAuth();
      navigate("/auth/sign-in");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again",
        { id: loadingToast }
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
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Sign out</h3>
              <p className="text-sm text-muted-foreground">
                You’ll need to sign in again to access your account
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 shrink-0"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Delete account</h3>
              <p className="text-sm text-muted-foreground">
                This action is irreversible and will permanently delete your
                account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 className="size-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-left">Delete Account</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Enter your password to confirm
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                Cancel
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
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
