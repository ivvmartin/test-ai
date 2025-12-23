"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useLocation, useNavigate } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/browser";
import { PLAN_METADATA } from "@/types/usage.types";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Separator } from "@components/ui/separator";
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
} from "@components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { useAuthStore } from "@store/auth.store";
import {
  useBillingStatus,
  useCreateCheckoutSession,
} from "@utils/billing-queries";
import { getMessages } from "@utils/chat-api";
import { useDeleteConversationMutation } from "@utils/chat-mutations";
import { useConversationsQuery } from "@utils/chat-queries";
import { exportConversationToPDF } from "@utils/export-pdf";
import { queryClient } from "@utils/queries";
import { useUsageSnapshot } from "@utils/usage-queries";

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: conversations = [], isLoading } = useConversationsQuery();
  const { data: billing } = useBillingStatus();
  const checkoutMutation = useCreateCheckoutSession();

  const deleteConversationMutation = useDeleteConversationMutation({
    onSuccess: () => {
      toast.success("Разговорът е изтрит успешно");
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      toast.error("Неуспешно изтриване на разговора. Моля, опитайте отново.");
    },
  });

  const handleNewChat = () => {
    navigate("/app/chat");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDeleteConversation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const conversation = conversations.find((c) => c.id === id);
    setConversationToDelete({
      id,
      title: conversation?.title || "Нов разговор",
    });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = () => {
    if (!conversationToDelete) return;

    if (location.pathname === `/app/chat/${conversationToDelete.id}`) {
      navigate("/app/chat");
    }

    deleteConversationMutation.mutate(conversationToDelete.id);
  };

  const handleExportConversation = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const conversation = conversations.find((c) => c.id === id);
      const conversationTitle = conversation?.title || "Нов разговор";

      const messages = await getMessages(id);

      if (!messages || messages.length === 0) {
        toast.error("Няма съобщения за експортиране");
        return;
      }

      await exportConversationToPDF(conversationTitle, messages);
    } catch (error) {
      console.error("Failed to export conversation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Неуспешен експорт на разговора. Моля, опитайте отново."
      );
    }
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
    checkoutMutation.mutate("PREMIUM", {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Неуспешно създаване на сесия за плащане. Моля, опитайте отново."
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
          <h2 className="font-semibold text-lg">ЕВТА Консулт</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-1">
        {/* Upgrade CTA */}
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
                      Надградете до Pro
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/90">
                    Получете 50 съобщения/месец и отключете премиум функции
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
                        Зареждане...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3" />
                        Надградете сега
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
                  <span>Начало</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Разговори (последните 10)</SidebarGroupLabel>
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
                <TooltipContent>Нов чат</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
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
                  className="px-2 py-4 text-center text-sm text-muted-foreground"
                >
                  Все още няма разговори
                </motion.div>
              ) : (
                conversations.map((conversation) => (
                  <div key={conversation.id}>
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
                            {conversation.title || "Нов разговор"}
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
                            >
                              <Download className="mr-2 size-4" />
                              <span>Експортиране</span>
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
                                  ? "Изтриване..."
                                  : "Изтрий"}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  </div>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-6">
        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            Ако предпочитате консултация с човек, свържете се с нашия експертен
            екип от адвокати по данъчно право
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изтриване на разговор</DialogTitle>
            <DialogDescription>
              Сигурни ли сте, че искате да изтриете разговора "
              {conversationToDelete?.title}"? Това действие не може да бъде
              отменено.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteConversationMutation.isPending}
            >
              Отказ
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteConversation}
              disabled={deleteConversationMutation.isPending}
            >
              {deleteConversationMutation.isPending ? "Изтриване..." : "Изтрий"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      return "Чат";
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
    setIsLoggingOut(true);
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
      // Still navigate to sign-in even if server logout fails
      clearAuth();
      queryClient.clear();
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
            <button className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent">
              <Avatar className="size-7 bg-muted rounded-2xl">
                <AvatarFallback className="bg-muted rounded-2xl text-xs flex items-center justify-center">
                  {user?.email.replace(/@.*$/, "")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[13px] font-medium max-w-[180px] truncate">
                  {user?.email || ""}
                </span>
                {usage && (
                  <span
                    className="text-[11px] font-medium text-muted-foreground"
                    style={{ color: PLAN_METADATA[usage.planKey].color }}
                  >
                    {PLAN_METADATA[usage.planKey].name.toLocaleUpperCase()} план
                  </span>
                )}
              </div>
              {isProfileDropdownOpen ? (
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
            <DropdownMenuItem onClick={() => navigate("/app/profile")}>
              <User className="mr-2 size-4" />
              Моят профил
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/app/billing")}>
              <CreditCard className="mr-2 size-4" />
              Абонамент и плащане
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Изход
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
