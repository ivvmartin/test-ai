import { CornerRightUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@components/ui/textarea";
import { useAutoResizeTextarea } from "@utils/hooks";

interface AiInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
  resizable?: boolean;
  usage?: {
    used: number;
    monthlyLimit: number;
    remaining: number;
    periodEnd: string;
  };
}

export function AiInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  disabled,
  isNearLimit,
  isAtLimit,
  resizable = false,
  usage,
}: AiInputProps) {
  // Not used when resizable=true
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 50,
    maxHeight: 200,
  });

  const showWarning = isNearLimit || isAtLimit;

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-4xl rounded-2xl bg-muted/50 shadow-lg">
        {/* Warning Banner */}
        {showWarning && (
          <div
            className={cn(
              "flex items-center justify-between rounded-t-2xl border border-b-0 px-5 py-2.5 transition-all duration-200 bg-background"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium text-xs",
                  isAtLimit ? "text-destructive" : "text-yellow-700"
                )}
              >
                {usage?.remaining || 0} оставащи съобщения
              </span>
            </div>
            <a
              href="/app/billing"
              className={cn(
                "font-medium underline-offset-4 hover:underline text-xs",
                isAtLimit ? "text-destructive" : "text-yellow-700"
              )}
            >
              {isAtLimit
                ? "Надградете, за да продължите"
                : "Надградете за повече"}
            </a>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          id="ai-input-06"
          placeholder={
            isAtLimit
              ? "Лимитът за използване е достигнат. Надградете, за да продължите."
              : "Напишете вашия въпрос за ДДС тук…"
          }
          className={cn(
            "bg-background text-foreground placeholder:text-muted-foreground/70 w-full border border-input py-4 pr-12 pl-5 leading-relaxed",
            resizable
              ? "resize-y min-h-[56px] max-h-[400px] overflow-y-auto"
              : "resize-none min-h-[56px]",
            "shadow-sm",
            !resizable && "transition-all duration-200",
            "focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50",
            "placeholder:text-sm sm:placeholder:text-sm",
            !resizable &&
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            showWarning ? "rounded-b-2xl rounded-t-none" : "rounded-2xl",
            disabled && "cursor-not-allowed opacity-60"
          )}
          value={value}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            onChange(e);
            if (!resizable) {
              adjustHeight();
            }
          }}
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
