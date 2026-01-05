import { InfoIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@components/ui/sidebar";
import { AiInput } from "./AiInput";

interface ChatWelcomeProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isAtLimit?: boolean;
  isNearLimit?: boolean;
  usage?: {
    used: number;
    monthlyLimit: number;
    remaining: number;
    periodEnd: string;
  };
}

export function ChatWelcome({
  input,
  onInputChange,
  onSubmit,
  onKeyDown,
  isAtLimit,
  isNearLimit,
  usage,
}: ChatWelcomeProps) {
  const { isMobile } = useSidebar();

  return (
    <div
      className={`flex min-h-[calc(70vh-2.5rem)] w-full items-center justify-center p-4 ${
        isMobile ? "" : "pl-18"
      }`}
    >
      <div className="flex w-full max-w-xl flex-col items-center justify-center space-y-10">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight md:text-2xl">
              Незабавен AI отговор за българския ДДС
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Информация"
                >
                  <InfoIcon className="size-4 md:size-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="max-w-[320px] py-3 shadow-none"
                side="bottom"
                align="center"
              >
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Отговорът ще бъде основан на актуалното законодателство в
                    сила към днешна дата (последно изменение в сила от
                    01.01.2026 г.)
                  </p>
                  <div className="space-y-1.5">
                    <p className="font-medium text-[13px]">
                      За най-добри резултати:
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground text-xs">
                      <li>Опишете фактите подробно;</li>
                      <li>Формулирайте въпроса си конкретно</li>
                    </ul>
                  </div>
                  <p className="pt-1 font-medium text-[13px]">
                    Готови ли сте да получите отговор?
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-muted-foreground text-base md:text-md">
            Получавайте бързи, точни и уверени справки по законодателството,
            създадени за счетоводители и адвокати
          </p>
        </div>

        <form onSubmit={onSubmit} className="w-full">
          <AiInput
            value={input}
            onChange={onInputChange}
            onSubmit={onSubmit}
            onKeyDown={onKeyDown}
            disabled={isAtLimit}
            isNearLimit={isNearLimit}
            isAtLimit={isAtLimit}
            resizable
            usage={usage}
          />
        </form>
      </div>
    </div>
  );
}
