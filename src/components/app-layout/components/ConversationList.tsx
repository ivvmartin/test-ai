import { motion } from "framer-motion";
import { Download, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";

import type { Conversation } from "@/types/chat.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onConversationClick: (id: string) => void;
  onExport: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  isDeleting: boolean;
}

export function ConversationList({
  conversations,
  isLoading,
  activeConversationId,
  onConversationClick,
  onExport,
  onDelete,
  isDeleting,
}: ConversationListProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (conversations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-2 py-4 text-center text-sm text-muted-foreground"
      >
        Все още няма чатове
      </motion.div>
    );
  }

  return (
    <SidebarMenu>
      {conversations.map((conversation) => (
        <div key={conversation.id}>
          <SidebarMenuItem className="group/conversation-item">
            <div className="relative flex w-full items-center gap-1">
              <SidebarMenuButton
                isActive={activeConversationId === conversation.id}
                onClick={() => onConversationClick(conversation.id)}
                className="flex-1 min-w-0 pr-8"
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap">
                  {conversation.title || "Нов чат"}
                </span>
              </SidebarMenuButton>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute right-1 flex size-7 shrink-0 items-center justify-center rounded-md opacity-0 outline-none transition-opacity hover:bg-accent hover:opacity-100 focus-visible:opacity-100 group-hover/conversation-item:opacity-100 data-[state=open]:bg-accent data-[state=open]:opacity-100"
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
                      onExport(conversation.id, e);
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    <span>Експортиране</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conversation.id, e);
                    }}
                    disabled={isDeleting}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    <span>{isDeleting ? "Изтриване..." : "Изтрий"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        </div>
      ))}
    </SidebarMenu>
  );
}
