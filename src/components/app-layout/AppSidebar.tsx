"use client";

import { Home, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useLocation, useNavigate } from "@/lib/navigation";
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
  useDeleteConversationMutation,
  useExportConversationMutation,
} from "@utils/chat-mutations";
import { useConversationsQuery } from "@utils/chat-queries";
import { useUsageSnapshot } from "@utils/usage-queries";

import { ConversationList } from "./components/ConversationList";
import { DeleteConversationDialog } from "./components/DeleteConversationDialog";
import { UpgradeCTA } from "./components/UpgradeCTA";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: conversations = [], isLoading } = useConversationsQuery();
  const { data: usage } = useUsageSnapshot();

  const checkoutMutation = useCreateCheckoutSession();
  const exportConversationMutation = useExportConversationMutation();
  const deleteConversationMutation = useDeleteConversationMutation({
    onSuccess: () => {
      toast.success("Чатът е изтрит успешно");
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      toast.error("Неуспешно изтриване на чата. Моля, опитайте отново");
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
      title: conversation?.title || "Нов чат",
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

  const handleExportConversation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    toast.promise(exportConversationMutation.mutateAsync(id), {
      loading: "Експортиране на чата...",
      success: "Чатът е експортиран успешно",
      error: (err) =>
        err instanceof Error
          ? err.message
          : "Неуспешен експорт на чата. Моля, опитайте отново",
    });
  };

  const handleConversationClick = (id: string) => {
    navigate(`/app/chat/${id}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleUpgrade = () => {
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

  const isFreeUser = usage?.planKey === "FREE";
  const activeConversationId = location.pathname.startsWith("/app/chat/")
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
          <h2 className="font-semibold text-lg">ЕВТА Консулт</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-1">
        {isFreeUser && (
          <UpgradeCTA
            onUpgrade={handleUpgrade}
            isPending={checkoutMutation.isPending}
          />
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
            <SidebarGroupLabel>Чатове (последните 10)</SidebarGroupLabel>
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
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              activeConversationId={activeConversationId}
              onConversationClick={handleConversationClick}
              onExport={handleExportConversation}
              onDelete={handleDeleteConversation}
              isDeleting={deleteConversationMutation.isPending}
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
              href="mailto:office@evtaconsult.com"
              className="block text-primary hover:underline"
            >
              office@evtaconsult.com
            </a>
          </div>
        </div>
      </SidebarFooter>

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        conversationTitle={conversationToDelete?.title || ""}
        onConfirm={confirmDeleteConversation}
        isPending={deleteConversationMutation.isPending}
      />
    </Sidebar>
  );
}
