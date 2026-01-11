"use client";

import { Check, Crown, Sparkles } from "lucide-react";

import { useIsMobile } from "@/utils/hooks";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";

interface PlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPremium: () => void;
  isPending: boolean;
}

const TRIAL_FEATURES = [
  "15 въпроса/казуса за 7 дни",
  "Посочване на законови норми",
  "Експорт за досието на клиента",
];

const PREMIUM_FEATURES = [
  "50 въпроса/казуса за месец",
  "Подробни отговори на сложни въпроси",
  "Пълна история на последните 25 консултации",
  "Посочване на законови норми",
  "Експорт за досието на клиента",
];

export function PlansDialog({
  open,
  onOpenChange,
  onSelectPremium,
  isPending,
}: PlansDialogProps) {
  const isMobile = useIsMobile();

  const plansContent = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-6 pt-2">
        {/* Trial Plan */}
        <div className="relative rounded-xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">ТЕСТ</h3>
              <p className="text-sm font-medium text-muted-foreground">
                0 евро
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              За да видите възможностите на AI асистента
            </p>
            <div className="space-y-2 sm:space-y-3">
              {TRIAL_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="size-4 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
              Подходящо за първа преценка дали инструментът Ви спестява време и
              несигурност. Без въвеждане на данни за плащания
            </p>
          </div>

          <Button variant="outline" className="w-full" disabled>
            Текущ план
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="relative rounded-xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Crown className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">ПРЕМИУМ</h3>
              <p className="text-sm font-medium">
                <span>50 евро/месец</span>
                <span className="text-muted-foreground text-xs">
                  {" "}
                  (+10 евро ДДС)
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              За ежедневна професионална употреба при счетоводители и адвокати
            </p>

            <div className="space-y-2 sm:space-y-3">
              {PREMIUM_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="size-4 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
              Проектиран за реалния ритъм на работа на професионалисти и малки
              кантори
            </p>
          </div>

          <Button
            onClick={onSelectPremium}
            disabled={isPending}
            className="w-full gap-2"
          >
            {isPending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Пренасочване...
              </>
            ) : (
              <>
                <Crown className="size-4" />
                Надградете сега
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-4 sm:pb-6 pt-6">
        <p className="text-xs text-muted-foreground text-start">
          * Можете да откажете от абонамента си по всяко време
        </p>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="p-0 max-h-[90vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-3 text-left shrink-0">
            <SheetTitle className="text-lg">Изберете план</SheetTitle>
            <SheetDescription className="text-sm">
              Изберете плана, който най-добре отговаря на вашите нужди
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto flex-1">{plansContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Изберете план</DialogTitle>
          <DialogDescription>
            Изберете плана, който най-добре отговаря на вашите нужди
          </DialogDescription>
        </DialogHeader>
        {plansContent}
      </DialogContent>
    </Dialog>
  );
}
