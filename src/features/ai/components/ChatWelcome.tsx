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
      className={`flex h-[calc(70vh-2.5rem)] w-full items-center justify-center p-4 ${
        isMobile ? "" : "pl-18"
      }`}
    >
      <div className="flex w-full max-w-xl flex-col items-center justify-center space-y-10">
        <div className="space-y-4 text-center">
          <h1 className="font-semibold text-2xl tracking-tight md:text-2xl">
            Незабавна яснота относно българския ДДС
          </h1>
          <p className="text-muted-foreground text-base md:text-md">
            Задайте въпрос по ЗДДС и получете ясно и структурирано обяснение,
            съобразено с конкретния ви случай
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
            usage={usage}
          />
        </form>
      </div>
    </div>
  );
}
