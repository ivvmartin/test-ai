import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { useMemo } from "react";

import { generateUserAvatar } from "@/lib/avatar";
import { PLAN_METADATA, type PlanKey } from "@/types/usage.types";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Skeleton } from "@components/ui/skeleton";

interface UserMenuProps {
  userEmail: string | undefined;
  planKey: PlanKey | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateProfile: () => void;
  onNavigateBilling: () => void;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export function UserMenu({
  userEmail,
  planKey,
  isOpen,
  onOpenChange,
  onNavigateProfile,
  onNavigateBilling,
  onNavigateTerms,
  onNavigatePrivacy,
  onLogout,
  isLoading = false,
}: UserMenuProps) {
  const avatarUrl = useMemo(
    () => (userEmail ? generateUserAvatar(userEmail) : null),
    [userEmail]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 md:gap-2.5 rounded-lg px-1 md:px-2.5 py-1 md:py-1.5">
        <Skeleton className="rounded-2xl flex-shrink-0 size-7" />
        <div className="hidden md:flex flex-col items-start gap-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="flex cursor-pointer items-center gap-1 md:gap-2.5 rounded-lg px-1 md:px-2.5 py-1 md:py-1.5 transition-colors hover:bg-accent">
          <Avatar className="rounded-2xl flex-shrink-0 size-7">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="User avatar" />}
            <AvatarFallback className="bg-muted rounded-2xl flex items-center justify-center text-xs">
              {userEmail?.replace(/@.*$/, "")[0].toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="font-medium whitespace-nowrap text-xs md:text-[12px]">
              {userEmail || ""}
            </span>
            {planKey && (
              <span
                className="font-medium text-muted-foreground whitespace-nowrap text-[10px] md:text-[11px]"
                style={{ color: PLAN_METADATA[planKey].color }}
              >
                {PLAN_METADATA[planKey].name.toLocaleUpperCase()} план
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp
              className="size-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="size-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Моят акаунт</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateProfile}>
          <User className="mr-2 size-4" />
          Моят профил
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNavigateBilling}>
          <CreditCard className="mr-2 size-4" />
          Абонамент и плащане
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Правна информация</DropdownMenuLabel>
        <DropdownMenuItem onClick={onNavigateTerms}>
          <FileText className="mr-2 size-4" />
          Общи условия
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNavigatePrivacy}>
          <Shield className="mr-2 size-4" />
          Политика за поверителност
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 size-4" />
          Изход
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
