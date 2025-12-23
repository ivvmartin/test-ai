import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useRef } from "react";

import { Button } from "@components/ui/button";
import { cn } from "@utils/index";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your question...",
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Header Section */}
      <div className="space-y-2 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-normal text-2xl"
        >
          Ask me a VAT question
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-muted-foreground text-base"
        >
          Describe your case clearly and in full, in Bulgarian
        </motion.p>
      </div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <div className="relative w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none overflow-hidden rounded-t-xl bg-transparent px-5 py-4 pr-14 text-md outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-base [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end border-t border-border/50 px-2 py-1">
            <Button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              variant="ghost"
              className="gap-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Send className="size-4.5" />
              <span className="text-base">Send</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
