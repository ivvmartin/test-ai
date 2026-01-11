"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { animations } from "@/lib/motion";
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
import { useChatsQuery } from "@utils/chat-queries";
import { queryClient } from "@utils/queries";
import { useUsageSnapshot, useUserIdentity } from "@utils/usage-queries";
import {
  LegalTopicSelector,
  type LegalTopic,
} from "./components/LegalTopicSelector";
import { UserMenu } from "./components/UserMenu";
import { useScrollDetection } from "./hooks/useScrollDetection";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const supabase = createClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: userIdentity, isLoading: isLoadingUserIdentity } =
    useUserIdentity();
  const { data: usage, isLoading: isLoadingUsage } = useUsageSnapshot();
  const { data: chats = [] } = useChatsQuery();
  const { open, isMobile } = useSidebar();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLegalTopicSelectorOpen, setIsLegalTopicSelectorOpen] =
    useState(false);
  const [selectedLegalTopic, setSelectedLegalTopic] =
    useState<LegalTopic>("ДДС");
  const isScrolled = useScrollDetection(20);

  const chatId = location.pathname.startsWith("/app/chat/")
    ? location.pathname.split("/app/chat/")[1]
    : null;

  const currentChat = chatId ? chats.find((c) => c.id === chatId) : null;

  const getPageTitle = () => {
    if (location.pathname.startsWith("/app/chat")) {
      if (currentChat?.title) {
        return currentChat.title;
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
      toast.success("Излязохте успешно");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      queryClient.clear();
      navigate("/auth/sign-in");
      toast.error("Възникна неочаквана грешка");
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
          : "left-0 right-0"
      )}
    >
      <header
        className={cn(
          "bg-background mx-auto flex items-center justify-between px-2 md:px-6 overflow-x-auto transition-[background-color] duration-500 ease-in-out h-14",
          isScrolled && "bg-background/70 backdrop-blur-sm border-b"
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
          <motion.div
            key={location.pathname}
            {...animations.fadeInDown}
            className="flex items-center min-w-0 flex-1"
          >
            {location.pathname === "/app/chat" && !currentChat ? (
              <LegalTopicSelector
                selectedTopic={selectedLegalTopic}
                onTopicChange={setSelectedLegalTopic}
                isOpen={isLegalTopicSelectorOpen}
                onOpenChange={setIsLegalTopicSelectorOpen}
              />
            ) : (
              <h1 className="text-sm md:text-[15px] font-medium truncate max-w-[300px] md:max-w-[500px]">
                {getPageTitle()}
              </h1>
            )}
          </motion.div>
        </div>

        <div className="flex items-center gap-1 md:gap-6 flex-shrink-0 ml-2">
          <UserMenu
            userEmail={userIdentity?.email}
            planKey={usage?.planKey}
            isOpen={isProfileDropdownOpen}
            onOpenChange={setIsProfileDropdownOpen}
            onNavigateProfile={() => navigate("/app/profile")}
            onNavigateBilling={() => navigate("/app/billing")}
            onNavigateTerms={() => navigate("/legal#tos")}
            onNavigatePrivacy={() => navigate("/legal#pp")}
            onLogout={handleLogout}
            isLoading={isLoadingUserIdentity || isLoadingUsage}
          />
        </div>
      </header>
    </nav>
  );
}
