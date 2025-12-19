"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Crown,
  Download,
  Home,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  User,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "@/lib/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth.store";
import { PLAN_METADATA } from "@/types/usage.types";
import { cn } from "@/utils";
import {
  useBillingStatus,
  useCreateCheckoutSession,
} from "@/utils/billing-queries";
import { useDeleteConversationMutation } from "@/utils/chat-mutations";
import { useConversationsQuery } from "@/utils/chat-queries";
import { useUsageSnapshot } from "@/utils/usage-queries";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  // Backend queries
  const { data: conversations = [], isLoading } = useConversationsQuery();
  const { data: billing } = useBillingStatus();
  const checkoutMutation = useCreateCheckoutSession();

  // Backend mutations
  const deleteConversationMutation = useDeleteConversationMutation({
    onSuccess: () => {
      toast.success("Conversation deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete conversation. Please try again.");
    },
  });

  const handleNewChat = () => {
    // Navigate to chat home instead of creating conversation immediately
    // Conversation will be created when first message is sent
    navigate("/app/chat");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDeleteConversation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // If we're currently viewing this conversation, redirect to chat home
    if (location.pathname === `/app/chat/${id}`) {
      navigate("/app/chat");
    }

    // Delete the conversation
    deleteConversationMutation.mutate(id);
  };

  const handleExportConversation = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    toast.info("Export functionality coming soon");
  };

  const handleConversationClick = (id: string) => {
    navigate(`/app/chat/${id}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isConversationActive = (id: string) =>
    location.pathname === `/app/chat/${id}`;

  const handleUpgrade = () => {
    const loadingToast = toast.loading("Redirecting to checkout...");
    checkoutMutation.mutate("PREMIUM", {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create checkout session. Please try again.",
          { id: loadingToast }
        );
      },
    });
  };

  const isFreeUser = billing?.planKey === "FREE";

  return (
    <Sidebar>
      <SidebarHeader className="p-[16px]">
        <div
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-101"
          onClick={() => {
            navigate("/app/chat");
            if (isMobile) {
              setOpenMobile(false);
            }
          }}
        >
          <h2 className="font-semibold text-lg">EVTA Consult</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-1">
        {/* Upgrade CTA - Only show for FREE users */}
        {isFreeUser && (
          <SidebarGroup>
            <SidebarGroupContent className="px-2 py-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-lg bg-[#35517f] p-4 text-white shadow-lg"
              >
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 size-32 rounded-full bg-white/5" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="size-5" />
                    <span className="font-semibold text-sm">
                      Upgrade to Pro
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/90">
                    Get 50 messages/month and unlock premium features
                  </p>
                  <Button
                    onClick={handleUpgrade}
                    disabled={checkoutMutation.isPending}
                    size="sm"
                    className="w-full gap-2 bg-white text-[#35517f] hover:bg-white/90"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/app/chat"}
                  onClick={() => {
                    navigate("/app/chat");
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <Home className="size-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Conversations (last 10 saved)</SidebarGroupLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={handleNewChat}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 px-2 py-4"
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="size-4 animate-pulse rounded bg-muted" />
                        <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </motion.div>
                ) : conversations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-2 py-4 text-center text-sm text-muted-foreground"
                  >
                    No conversations yet
                  </motion.div>
                ) : (
                  conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SidebarMenuItem className="group/conversation-item">
                        <div className="relative flex w-full items-center">
                          <SidebarMenuButton
                            isActive={isConversationActive(conversation.id)}
                            onClick={() =>
                              handleConversationClick(conversation.id)
                            }
                            className="flex-1"
                          >
                            <MessageSquare className="size-4 shrink-0" />
                            <span className="truncate">
                              {conversation.title || "New Conversation"}
                            </span>
                          </SidebarMenuButton>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="absolute right-2 flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 outline-none transition-opacity hover:bg-accent hover:opacity-100 focus-visible:opacity-100 group-hover/conversation-item:opacity-100 data-[state=open]:bg-accent data-[state=open]:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              side="right"
                              className="w-48"
                              sideOffset={8}
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportConversation(conversation.id, e);
                                }}
                                disabled
                              >
                                <Download className="mr-2 size-4" />
                                <span>Export</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation.id, e);
                                }}
                                disabled={deleteConversationMutation.isPending}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                <span>
                                  {deleteConversationMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuItem>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-6">
        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            If you prefer a consultation with a human, reach out to our expert
            team of tax law attorneys
          </p>
          <div className="space-y-1">
            <a
              href="https://www.evtaconsult.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary hover:underline"
            >
              www.evtaconsult.com
            </a>
            <a
              href="mailto:office@evtaconsult.com"
              className="block text-primary hover:underline"
            >
              office@evtaconsult.com
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: usage } = useUsageSnapshot();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getPageTitle = () => {
    if (location.pathname.startsWith("/app/chat")) {
      return "Chat";
    }
    if (location.pathname.startsWith("/app/profile")) {
      return "Profile";
    }
    if (location.pathname.startsWith("/app/billing")) {
      return "Billing";
    }
    return "Dashboard";
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error("Failed to sign out. Please try again");
        return;
      }
      clearAuth();
      navigate("/auth/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred");
      // Still navigate to sign-in even if server logout fails
      clearAuth();
      navigate("/auth/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <motion.h1
          key={location.pathname}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-semibold text-lg"
        >
          {getPageTitle()}
        </motion.h1>
      </div>

      <div className="flex items-center gap-6">
        {/* User Menu */}
        <DropdownMenu
          open={isProfileDropdownOpen}
          onOpenChange={setIsProfileDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                  <UserIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              {isProfileDropdownOpen ? (
                <ChevronUp
                  className="w-5 h-5 text-neutral-500"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="w-5 h-5 text-neutral-500"
                  aria-hidden="true"
                />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                  <UserIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5">
                <p className="font-medium text-sm">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || ""}
                </p>
                {usage && (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      PLAN_METADATA[usage.planKey].color
                    )}
                  >
                    {PLAN_METADATA[usage.planKey].name} Plan
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/app/profile")}>
              <User className="mr-2 size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/app/billing")}>
              <CreditCard className="mr-2 size-4" />
              Billing & Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
