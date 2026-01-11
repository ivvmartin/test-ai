import type { Transition, Variants } from "framer-motion";

/**
 * Standard animation configurations for consistent motion across the app
 */

// Standard transitions
export const transitions = {
  /** Fast micro-interactions (buttons, toggles) */
  fast: { duration: 0.15, ease: "easeOut" } as Transition,

  /** Default transition for most animations */
  default: { duration: 0.2, ease: "easeOut" } as Transition,

  /** Smooth transitions for larger elements */
  smooth: { duration: 0.3, ease: "easeInOut" } as Transition,

  /** Spring animation for bouncy effects */
  spring: { type: "spring", stiffness: 300, damping: 25 } as Transition,
} as const;

// Standard animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Inline animation props
export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: transitions.default,
  },
  fadeInDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: transitions.default,
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: transitions.default,
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: transitions.default,
  },
} as const;
