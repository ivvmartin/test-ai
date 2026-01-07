import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

export type LegalTopic = "ДДС" | "ЗКПО" | "ЗДДФЛ" | "ДОПК";

interface LegalTopicOption {
  value: LegalTopic;
  label: string;
  subtitle?: string;
  disabled: boolean;
}

const LEGAL_TOPIC_OPTIONS: LegalTopicOption[] = [
  { value: "ДДС", label: "ДДС", disabled: false },
  {
    value: "ЗКПО",
    label: "ЗКПО",
    subtitle: "Корпоративен данък",
    disabled: true,
  },
  { value: "ЗДДФЛ", label: "ЗДДФЛ", disabled: true },
  { value: "ДОПК", label: "ДОПК", disabled: true },
];

interface LegalTopicSelectorProps {
  selectedTopic: LegalTopic;
  onTopicChange: (topic: LegalTopic) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegalTopicSelector({
  selectedTopic,
  onTopicChange,
  isOpen,
  onOpenChange,
}: LegalTopicSelectorProps) {
  const handleSelectTopic = (option: LegalTopicOption) => {
    if (!option.disabled) {
      onTopicChange(option.value);
      onOpenChange(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex cursor-pointer items-center gap-1 md:gap-2.5 rounded-lg px-1 md:px-2.5 py-1 md:py-1.5 transition-colors",
            "hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="Избор на правна тема"
        >
          <span className="text-sm md:text-[15px] font-medium whitespace-nowrap">
            {selectedTopic}
          </span>
          {isOpen ? (
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
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {LEGAL_TOPIC_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelectTopic(option)}
            disabled={option.disabled}
            className={cn(
              "flex items-center justify-between gap-3 py-2.5 px-3",
              option.value === selectedTopic && !option.disabled && "bg-accent"
            )}
          >
            <div className="flex flex-col">
              <span className="text-sm md:text-[15px]">{option.label}</span>
              {option.subtitle && (
                <span className="text-[11px] md:text-xs text-muted-foreground">
                  {option.subtitle}
                </span>
              )}
            </div>
            {option.disabled && (
              <span className="text-[10px] md:text-[11px] text-muted-foreground">
                Скоро!
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
