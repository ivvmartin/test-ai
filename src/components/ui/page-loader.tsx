"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Scale } from "lucide-react";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show loader if loading takes more than 200ms
    // This prevents flashing for fast navigations
    const showTimer = setTimeout(() => {
      setShouldShow(true);
    }, 300);

    return () => {
      clearTimeout(showTimer);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-screen w-full items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex flex-col items-center gap-6"
          >
            {/* Orbiting Documents */}
            <div className="relative size-32">
              {/* Document 1 - Top */}
              <motion.div
                className="absolute left-1/2 top-0 -translate-x-1/2"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ transformOrigin: "center 64px" }}
              >
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <FileText className="size-4 text-[#35517f]" />
                </motion.div>
              </motion.div>

              {/* Document 2 - Right */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-y-1/2"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 2,
                }}
                style={{ transformOrigin: "-64px center" }}
              >
                <motion.div
                  animate={{
                    x: [0, 4, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <FileText className="size-4 text-[#35517f]" />
                </motion.div>
              </motion.div>

              {/* Document 3 - Bottom */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 4,
                }}
                style={{ transformOrigin: "center -64px" }}
              >
                <motion.div
                  animate={{
                    y: [0, 4, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                >
                  <FileText className="size-4 text-[#35517f]" />
                </motion.div>
              </motion.div>

              {/* Document 4 - Left */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-y-1/2"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 6,
                }}
                style={{ transformOrigin: "64px center" }}
              >
                <motion.div
                  animate={{
                    x: [0, -4, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5,
                  }}
                >
                  <FileText className="size-4 text-[#35517f]" />
                </motion.div>
              </motion.div>

              {/* Central Scale Icon */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="rounded-2xl bg-[#21355a] p-4 shadow-lg">
                  <Scale className="size-10 text-white" strokeWidth={1.5} />
                </div>
              </motion.div>
            </div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.p
                className="text-sm font-medium text-[#21355a]"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Зареждане...
              </motion.p>

              {/* Loading dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="size-1.5 rounded-full bg-[#35517f]"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
