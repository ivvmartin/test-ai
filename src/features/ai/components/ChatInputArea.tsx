import { memo } from "react";

import { cn } from "@/lib/utils";
import { AiInput } from "./AiInput";

interface ChatInputAreaProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isDisabled: boolean;
  isNearLimit: boolean;
  isAtLimit: boolean;
  usage?: {
    used: number;
    monthlyLimit: number;
    remaining: number;
    periodEnd: string;
  };
  sidebarState: "expanded" | "collapsed";
  isMobile: boolean;
}

/**
 * ChatInputArea component - Fixed input area at the bottom of the chat
 */
export const ChatInputArea = memo(function ChatInputArea({
  input,
  onInputChange,
  onSubmit,
  isDisabled,
  isNearLimit,
  isAtLimit,
  usage,
  sidebarState,
  isMobile,
}: ChatInputAreaProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-2 left-0 right-0 z-50 px-4 pt-4 pb-1 md:px-6 md:pt-6 md:pb-2 transition-[left] duration-200 ease-linear",
        !isMobile &&
          sidebarState === "expanded" &&
          "md:left-[var(--sidebar-width)]"
      )}
    >
      <div className={`mx-auto w-full max-w-2xl ${isMobile ? "" : "pl-9"}`}>
        <form onSubmit={onSubmit} className="pointer-events-auto">
          <AiInput
            value={input}
            onChange={onInputChange}
            onSubmit={onSubmit}
            disabled={isDisabled}
            isNearLimit={isNearLimit}
            isAtLimit={isAtLimit}
            usage={usage}
          />
        </form>
      </div>
    </div>
  );
});
