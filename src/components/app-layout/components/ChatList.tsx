import { motion } from "framer-motion";
import { Download, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Chat } from "@/types/chat.types";
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
import TypewriterText from "@components/ui/text-typewriter";

interface ChatListProps {
  chats: Chat[];
  isLoading: boolean;
  activeChatId: string | null;
  onChatClick: (id: string) => void;
  onExport: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  isDeleting: boolean;
}

export function ChatList({
  chats,
  isLoading,
  activeChatId,
  onChatClick,
  onExport,
  onDelete,
  isDeleting,
}: ChatListProps) {
  const [typewritingChatId, setTypewritingChatId] = useState<string | null>(
    null
  );
  const previousChatsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    chats.forEach((chat) => {
      const previousTitle = previousChatsRef.current.get(chat.id);
      const currentTitle = chat.title || "Нов казус";

      if (previousTitle === "Нов казус" && currentTitle !== "Нов казус") {
        setTypewritingChatId(chat.id);
        setTimeout(() => {
          setTypewritingChatId(null);
        }, currentTitle.length * 50 + 500);
      }

      previousChatsRef.current.set(chat.id, currentTitle);
    });
  }, [chats]);

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

  if (chats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-2 py-4 text-center text-sm text-muted-foreground"
      >
        Все още няма казуси
      </motion.div>
    );
  }

  return (
    <SidebarMenu>
      {chats.map((chat) => (
        <div key={chat.id}>
          <SidebarMenuItem className="group/chat-item">
            <div className="relative flex w-full items-center gap-1">
              <SidebarMenuButton
                isActive={activeChatId === chat.id}
                onClick={() => onChatClick(chat.id)}
                className="flex-1 min-w-0 pr-8"
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap">
                  {typewritingChatId === chat.id ? (
                    <TypewriterText>{chat.title || "Нов казус"}</TypewriterText>
                  ) : (
                    chat.title || "Нов казус"
                  )}
                </span>
              </SidebarMenuButton>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute right-1 flex size-7 shrink-0 items-center justify-center rounded-md opacity-100 outline-none transition-opacity hover:bg-accent focus-visible:opacity-100 data-[state=open]:bg-accent data-[state=open]:opacity-100 md:opacity-0 md:group-hover/chat-item:opacity-100 md:hover:opacity-100"
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
                      onExport(chat.id, e);
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    <span>Експортиране</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(chat.id, e);
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
