import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSidebar } from "@components/ui/sidebar";
import { useUserIdentity } from "@utils/usage-queries";
import { AiInput } from "../components/AiInput";

interface ChatWelcomeProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
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
  isAtLimit,
  isNearLimit,
  usage,
}: ChatWelcomeProps) {
  const { isMobile } = useSidebar();
  const { data: userIdentity } = useUserIdentity();

  const isPremium =
    userIdentity?.plan === "PAID" || userIdentity?.plan === "INTERNAL";
  const showWarning = isNearLimit || isAtLimit;

  return (
    <div
      className={`flex min-h-[calc(70vh-2.5rem)] w-full items-center justify-center p-4 ${
        isMobile ? "" : "pl-18"
      }`}
    >
      <div className="flex w-full max-w-xl flex-col items-center justify-center space-y-10">
        <div className="space-y-8 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <h1
                className="inline cursor-pointer font-semibold text-2xl tracking-tight transition-colors md:text-2xl"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, currentColor 0px, currentColor 10px, transparent 10px, transparent 18px)",
                  backgroundSize: "100% 1.5px",
                  backgroundPosition: "0 100%",
                  backgroundRepeat: "repeat-x",
                  paddingBottom: "2px",
                  color: "inherit",
                }}
              >
                Незабавен AI отговор за българския ДДС
              </h1>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-[320px] py-3 shadow-none"
              side="bottom"
              align="center"
            >
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  Отговорът ще бъде основан на актуалното законодателство в сила
                  към днешна дата (последно изменение в сила от 01.01.2026 г.).
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
              </div>
            </PopoverContent>
          </Popover>
          <p className="!mt-3 text-muted-foreground text-base md:text-md px-4">
            Получавайте бързи, точни и уверени справки по законодателството,
            създадени за счетоводители и адвокати
          </p>
        </div>

        <form onSubmit={onSubmit} className="w-full">
          <div className="relative mx-auto w-full max-w-4xl">
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
                {!isPremium && (
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
                )}
              </div>
            )}
            <AiInput
              value={input}
              onChange={onInputChange}
              onSubmit={onSubmit}
              disabled={isAtLimit}
              hasWarningBanner={showWarning}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
