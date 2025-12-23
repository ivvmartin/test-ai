"use client";

import { motion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

interface BouncingDotsProps {
  className?: string;
  dotClassName?: string;
}

const bounceTransition: Transition = {
  duration: 0.9,
  repeat: Infinity,
  repeatType: "reverse",
  ease: "easeInOut",
};

export function BouncingDots({ className, dotClassName }: BouncingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <motion.div
        className={cn("h-2 w-2 rounded-full bg-primary/60", dotClassName)}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          ...bounceTransition,
          delay: 0,
        }}
      />
      <motion.div
        className={cn("h-2 w-2 rounded-full bg-primary/60", dotClassName)}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          ...bounceTransition,
          delay: 0.15,
        }}
      />
      <motion.div
        className={cn("h-2 w-2 rounded-full bg-primary/60", dotClassName)}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          ...bounceTransition,
          delay: 0.3,
        }}
      />
    </div>
  );
}
