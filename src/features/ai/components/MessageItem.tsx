import { motion } from "framer-motion";
import { Bot, Copy } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat.types";
import { MarkdownContent } from "@components/MarkdownContent";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { BouncingDots } from "@components/ui/bouncing-dots";

interface MessageItemProps {
  message: Message;
  userEmail?: string;
}

export const MessageItem = memo(
  ({ message, userEmail }: MessageItemProps) => {
    if (message.role === "user") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.05 }}
          className="flex flex-row gap-3 px-1 py-2 sm:gap-4 sm:px-2"
        >
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
            <span className="font-medium text-foreground text-sm">
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted rounded-2xl text-xs flex items-center justify-center">
                  {userEmail?.replace(/@.*$/, "")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center">
            <p className="text-foreground break-words text-[0.9rem] leading-relaxed">
              {message.content}
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.05 }}
        className="bg-muted/30 group relative flex gap-3 rounded-xl px-3 py-4 sm:gap-4 sm:px-4 sm:py-5"
      >
        <Bot className="bg-primary/10 text-primary flex size-8 shrink-0 rounded-full p-1.5" />
        {message.content === "..." ? (
          <div className="flex min-w-0 flex-1 items-center">
            <BouncingDots />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "text-foreground min-w-0 flex-1 overflow-x-auto",
                message.content === "Нещо се обърка. Моля, опитайте отново"
                  ? "rounded-lg border border-destructive/10 bg-destructive/10 p-3"
                  : ""
              )}
            >
              <MarkdownContent content={message.content} />
            </div>
            <button
              type="button"
              title="Копирай в клипборда"
              className="bg-background/80 hover:bg-background border-border/50 absolute top-3 right-3 rounded-md border p-1.5 opacity-0 shadow-sm transition-all hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success("Копирано в клипборда");
              }}
            >
              <Copy className="text-muted-foreground h-3.5 w-3.5" />
            </button>
          </>
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content or role changes
    // Don't compare ID to prevent flash when temp ID changes to real ID
    return (
      prevProps.message.role === nextProps.message.role &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.userEmail === nextProps.userEmail
    );
  }
);

MessageItem.displayName = "MessageItem";
