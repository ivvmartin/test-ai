import { ChevronDown, ChevronUp, CreditCard, LogOut, User } from "lucide-react";

import { PLAN_METADATA, type PlanKey } from "@/types/usage.types";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  onLogout: () => void;
  isScrolled?: boolean;
  isLoading?: boolean;
}

export function UserMenu({
  userEmail,
  planKey,
  isOpen,
  onOpenChange,
  onNavigateProfile,
  onNavigateBilling,
  onLogout,
  isScrolled = false,
  isLoading = false,
}: UserMenuProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 md:gap-2.5 rounded-lg px-1 md:px-2.5 py-1 md:py-1.5">
        <Skeleton
          className={`rounded-2xl flex-shrink-0 transition-all duration-500 ${
            isScrolled ? "size-6" : "size-7"
          }`}
        />
        <div className="flex flex-col items-start gap-1">
          <Skeleton
            className={`transition-all duration-500 ${
              isScrolled ? "h-3 w-24" : "h-3.5 w-28"
            }`}
          />
          <Skeleton
            className={`transition-all duration-500 ${
              isScrolled ? "h-2.5 w-16" : "h-3 w-20"
            }`}
          />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="flex cursor-pointer items-center gap-1 md:gap-2.5 rounded-lg px-1 md:px-2.5 py-1 md:py-1.5 transition-colors hover:bg-accent">
          <Avatar
            className={`bg-muted rounded-2xl flex-shrink-0 transition-all duration-500 ${
              isScrolled ? "size-6" : "size-7"
            }`}
          >
            <AvatarFallback
              className={`bg-muted rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isScrolled ? "text-[10px]" : "text-xs"
              }`}
            >
              {userEmail?.replace(/@.*$/, "")[0].toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span
              className={`font-medium whitespace-nowrap transition-all duration-500 ${
                isScrolled ? "text-[11px] md:text-xs" : "text-xs md:text-[13px]"
              }`}
            >
              {userEmail || ""}
            </span>
            {planKey && (
              <span
                className={`font-medium text-muted-foreground whitespace-nowrap transition-all duration-500 ${
                  isScrolled
                    ? "text-[9px] md:text-[10px]"
                    : "text-[10px] md:text-[11px]"
                }`}
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
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 size-4" />
          Изход
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
