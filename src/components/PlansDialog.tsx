"use client";

import { Check, Crown, Sparkles } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Изберете план</DialogTitle>
          <DialogDescription>
            Изберете плана, който най-добре отговаря на вашите нужди
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 pt-2">
          {/* Trial Plan */}
          <div className="relative rounded-xl border bg-card p-6 space-y-5">
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
              <p className="text-sm text-muted-foreground mb-4">
                За да видите възможностите на AI асистента
              </p>
              <div className="space-y-3">
                {TRIAL_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="size-4 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Подходящо за първа преценка дали инструментът Ви спестява време
                и несигурност. Без въвеждане на данни за плащания
              </p>
            </div>

            <Button variant="outline" className="w-full" disabled>
              Текущ план
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="relative rounded-xl border bg-card p-6 space-y-5">
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
              <p className="text-sm text-muted-foreground mb-4">
                За ежедневна професионална употреба при счетоводители и адвокати
              </p>

              <div className="space-y-3">
                {PREMIUM_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="size-4 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
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

        <div className="px-8 pb-6 pt-2">
          <p className="text-xs text-muted-foreground text-start">
            * Можете да откажете от абонамента си по всяко време
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
