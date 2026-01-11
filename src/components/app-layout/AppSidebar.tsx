"use client";

import { Home, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useLocation, useNavigate } from "@/lib/navigation";
import { PlansDialog } from "@components/PlansDialog";
import { Button } from "@components/ui/button";
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
  useSidebar,
} from "@components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { useCreateCheckoutSession } from "@utils/billing-queries";
import {
  useDeleteChatMutation,
  useExportChatMutation,
} from "@utils/chat-mutations";
import { useChatsQuery } from "@utils/chat-queries";
import { useUsageSnapshot } from "@utils/usage-queries";
import { ChatList } from "./components/ChatList";
import { DeleteChatDialog } from "./components/DeleteChatDialog";
import { UpgradeCTA } from "./components/UpgradeCTA";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: chats = [], isLoading } = useChatsQuery();
  const { data: usage } = useUsageSnapshot();

  const checkoutMutation = useCreateCheckoutSession();
  const exportChatMutation = useExportChatMutation();
  const deleteChatMutation = useDeleteChatMutation({
    onSuccess: () => {
      toast.success("Казусът е изтрит успешно");
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete chat:", error);
      toast.error("Неуспешно изтриване на казуса. Моля, опитайте отново");
    },
  });

  const handleNewChat = () => {
    navigate("/app/chat");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const chat = chats.find((c) => c.id === id);
    setChatToDelete({
      id,
      title: chat?.title || "Нов казус",
    });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = () => {
    if (!chatToDelete) return;

    if (location.pathname === `/app/chat/${chatToDelete.id}`) {
      navigate("/app/chat");
    }

    deleteChatMutation.mutate(chatToDelete.id);
  };

  const handleExportChat = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    toast.promise(exportChatMutation.mutateAsync(id), {
      loading: "Експортиране на казуса...",
      success: "Казусът е експортиран успешно",
      error: (err) =>
        err instanceof Error
          ? err.message
          : "Неуспешен експорт на казуса. Моля, опитайте отново",
    });
  };

  const handleChatClick = (id: string) => {
    navigate(`/app/chat/${id}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleOpenPlansDialog = () => {
    setPlansDialogOpen(true);
  };

  const handleSelectPremium = () => {
    checkoutMutation.mutate("PREMIUM", {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Неуспешно създаване на сесия за плащане. Моля, опитайте отново"
        );
      },
    });
  };

  const isFreeUser =
    usage?.planKey === "TRIAL" || usage?.planKey === "FREE_INTERNAL";
  const activeChatId = location.pathname.startsWith("/app/chat/")
    ? location.pathname.split("/app/chat/")[1]
    : null;

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
          <h2 className="font-semibold text-lg">EVTA AI</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-1">
        {isFreeUser && (
          <UpgradeCTA onUpgrade={handleOpenPlansDialog} isPending={false} />
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
            <SidebarGroupLabel>Казуси (последните 25)</SidebarGroupLabel>
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
                <TooltipContent>Нов казус</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <SidebarGroupContent>
            <ChatList
              chats={chats}
              isLoading={isLoading}
              activeChatId={activeChatId}
              onChatClick={handleChatClick}
              onExport={handleExportChat}
              onDelete={handleDeleteChat}
              isDeleting={deleteChatMutation.isPending}
            />
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
              href="mailto:ai@evtaconsult.com"
              className="block text-primary hover:underline"
            >
              ai@evtaconsult.com
            </a>
          </div>
        </div>
      </SidebarFooter>

      <DeleteChatDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        chatTitle={chatToDelete?.title || ""}
        onConfirm={confirmDeleteChat}
        isPending={deleteChatMutation.isPending}
      />

      <PlansDialog
        open={plansDialogOpen}
        onOpenChange={setPlansDialogOpen}
        onSelectPremium={handleSelectPremium}
        isPending={checkoutMutation.isPending}
      />
    </Sidebar>
  );
}
