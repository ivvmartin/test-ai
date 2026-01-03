"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { useLocation, useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Separator } from "@components/ui/separator";
import { SidebarTrigger, useSidebar } from "@components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { useAuthStore } from "@store/auth.store";
import { useConversationsQuery } from "@utils/chat-queries";
import { queryClient } from "@utils/queries";
import { useUsageSnapshot, useUserIdentity } from "@utils/usage-queries";

import { UserMenu } from "./components/UserMenu";
import { useScrollDetection } from "./hooks/useScrollDetection";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const supabase = createClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: userIdentity } = useUserIdentity();
  const { data: usage } = useUsageSnapshot();
  const { data: conversations = [] } = useConversationsQuery();
  const { open, isMobile } = useSidebar();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const isScrolled = useScrollDetection(20);

  const conversationId = location.pathname.startsWith("/app/chat/")
    ? location.pathname.split("/app/chat/")[1]
    : null;

  const currentConversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : null;

  const getPageTitle = () => {
    if (location.pathname.startsWith("/app/chat")) {
      if (currentConversation?.title) {
        return currentConversation.title;
      }
      return "Начало";
    }
    if (location.pathname.startsWith("/app/profile")) {
      return "Профил";
    }
    if (location.pathname.startsWith("/app/billing")) {
      return "Абонамент";
    }
    return "Табло";
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error("Неуспешен изход. Моля, опитайте отново");
        return;
      }
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Възникна неочаквана грешка");
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 z-40 transition-all duration-500 ease-in-out will-change-[padding,left,right]",
        isMobile
          ? "left-0 right-0"
          : open
          ? "left-[var(--sidebar-width)] right-0"
          : "left-0 right-0",
        isScrolled && "px-6 md:px-12"
      )}
    >
      <header
        className={cn(
          "bg-background mx-auto flex items-center justify-between border-b px-2 md:px-6 overflow-x-auto transition-all duration-500 ease-in-out will-change-[background-color,max-width,border-radius,box-shadow,margin-top] h-14",
          isScrolled &&
            "bg-background/70 max-w-10xl rounded-xl border backdrop-blur-sm shadow-md mt-1"
        )}
      >
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                {open ? "Скрий страничната лента" : "Покажи страничната лента"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 flex-shrink-0" />
          <motion.h1
            key={location.pathname}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium truncate"
          >
            {getPageTitle()}
          </motion.h1>
        </div>

        <div className="flex items-center gap-1 md:gap-6 flex-shrink-0 ml-2">
          <UserMenu
            userEmail={userIdentity?.email}
            planKey={usage?.planKey}
            isOpen={isProfileDropdownOpen}
            onOpenChange={setIsProfileDropdownOpen}
            onNavigateProfile={() => navigate("/app/profile")}
            onNavigateBilling={() => navigate("/app/billing")}
            onLogout={handleLogout}
            isScrolled={isScrolled}
          />
        </div>
      </header>
    </nav>
  );
}
