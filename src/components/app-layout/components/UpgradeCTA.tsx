import { motion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";

import { SidebarGroup, SidebarGroupContent } from "@components/ui/sidebar";

interface UpgradeCTAProps {
  onUpgrade: () => void;
  isPending: boolean;
}

export function UpgradeCTA({ onUpgrade, isPending }: UpgradeCTAProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-2 py-2">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onUpgrade}
          disabled={isPending}
          className="group relative w-full overflow-hidden rounded-lg bg-[#35517f] p-4 text-left text-white shadow-md transition-all hover:bg-[#2d4670] disabled:opacity-50"
        >
          <div className="absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 size-20 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="size-5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[13px]">Надгради плана</p>
                <p className="text-[11px] text-white/80 mr-2">
                  Отключи повече възможности и консултации
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </motion.button>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
