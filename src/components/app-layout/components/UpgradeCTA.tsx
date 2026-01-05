import { motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";

import { Button } from "@components/ui/button";
import { SidebarGroup, SidebarGroupContent } from "@components/ui/sidebar";

interface UpgradeCTAProps {
  onUpgrade: () => void;
  isPending: boolean;
}

export function UpgradeCTA({ onUpgrade, isPending }: UpgradeCTAProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-2 py-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-lg bg-[#35517f] p-4 text-white shadow-lg"
        >
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 size-32 rounded-full bg-white/5" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="size-5" />
              <span className="font-semibold text-sm">
                Надградете до Premium
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/90">
              Получете 50 съобщения/месец и отключете премиум функции
            </p>
            <Button
              onClick={onUpgrade}
              disabled={isPending}
              size="sm"
              className="w-full gap-2 bg-white text-[#35517f] hover:bg-white/90"
            >
              {isPending ? (
                <>
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Зареждане...
                </>
              ) : (
                <>
                  <Sparkles className="size-3" />
                  Надградете сега
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
