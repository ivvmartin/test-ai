import { CornerRightUp } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { Textarea } from "@components/ui/textarea";
import { useUserIdentity } from "@utils/usage-queries";

interface AiInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
  hasWarningBanner?: boolean;
  usage?: {
    used: number;
    monthlyLimit: number;
    remaining: number;
    periodEnd: string;
  };
}

const MIN_HEIGHT = 56;
const MAX_HEIGHT = 200;

export function AiInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isNearLimit,
  isAtLimit,
  hasWarningBanner,
  usage,
}: AiInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: userIdentity } = useUserIdentity();

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${MIN_HEIGHT}px`;
    const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
    textarea.style.height = `${Math.max(MIN_HEIGHT, newHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const isPremium =
    userIdentity?.plan === "PAID" || userIdentity?.plan === "INTERNAL";

  const getPlaceholder = () => {
    if (isAtLimit) {
      return isPremium
        ? "Лимитът за използване е достигнат"
        : "Лимитът е достигнат. Надградете за повече";
    }
    if (isNearLimit && usage) {
      return isPremium
        ? `${usage.remaining} оставащи съобщения · Напишете вашия въпрос тук…`
        : `${usage.remaining} оставащи · Надградете за повече → Напишете въпрос тук…`;
    }
    return "Напишете вашия въпрос за ДДС тук…";
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-4xl rounded-2xl bg-muted/50 shadow-lg">
        <Textarea
          ref={textareaRef}
          id="ai-input-06"
          enterKeyHint="send"
          placeholder={getPlaceholder()}
          className={cn(
            "bg-background text-foreground placeholder:text-muted-foreground/70 w-full border border-input py-4 pr-16 pl-5 leading-relaxed",
            "resize-none min-h-[56px] overflow-y-auto",
            "shadow-sm",
            "focus-visible:ring-0 focus-visible:border-input",
            "placeholder:text-xs sm:placeholder:text-sm",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            hasWarningBanner ? "rounded-b-2xl rounded-t-none" : "rounded-2xl",
            disabled && "cursor-not-allowed opacity-60"
          )}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <button
          onClick={onSubmit}
          className={cn(
            "absolute bottom-2.5 right-3 rounded-lg p-2 transition-all duration-200",
            value.trim() && !disabled
              ? "bg-primary/10 hover:bg-primary/20 opacity-100"
              : "bg-muted cursor-not-allowed opacity-40"
          )}
          type="button"
          disabled={!value.trim() || disabled}
          aria-label="Send message"
        >
          <CornerRightUp
            className={cn(
              "h-5 w-5 transition-colors",
              value.trim() && !disabled
                ? "text-primary"
                : "text-muted-foreground"
            )}
          />
        </button>
      </div>
    </div>
  );
}
