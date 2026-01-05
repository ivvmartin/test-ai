"use client";

import { cn } from "@/lib/utils";

interface BouncingDotsProps {
  className?: string;
  dotClassName?: string;
}

/**
 * Bouncing dots loading indicator using CSS animations
 */
export function BouncingDots({ className, dotClassName }: BouncingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce-dot",
          dotClassName
        )}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce-dot",
          dotClassName
        )}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce-dot",
          dotClassName
        )}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
