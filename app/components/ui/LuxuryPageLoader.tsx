"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CLOUDINARY_URLS } from "../../assets";

interface LuxuryPageLoaderProps {
  isLoading: boolean;
  onFinish?: () => void;
}

export default function LuxuryPageLoader({ isLoading }: LuxuryPageLoaderProps) {
  const [progress, setProgress] = useState(15);
  const [shouldRender, setShouldRender] = useState(isLoading);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      setShouldRender(true);
      // Fluid progress simulation while parallel requests resolve
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          const increment = Math.max(2, Math.floor((90 - prev) / 6));
          return Math.min(prev + increment, 92);
        });
      }, 120);
    } else {
      // Complete to 100% when parallel fetch finishes
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setShouldRender(false);
      }, 550);
      return () => clearTimeout(hideTimer);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  const isVisible = shouldRender;

  // Prevent any scrolling (mouse wheel, touch swipe, keys, scrollbars) while loader is visible
  useEffect(() => {
    if (isVisible) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyWidth = document.body.style.width;
      const originalBodyHeight = document.body.style.height;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      const preventScrollKeys = (e: KeyboardEvent) => {
        const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Space", "Home", "End"];
        if (keys.includes(e.code) || keys.includes(e.key)) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventScrollKeys, { passive: false });
      document.addEventListener("wheel", preventScroll, { passive: false });
      document.addEventListener("touchmove", preventScroll, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.width = originalBodyWidth;
        document.body.style.height = originalBodyHeight;

        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventScrollKeys);
        document.removeEventListener("wheel", preventScroll);
        document.removeEventListener("touchmove", preventScroll);
      };
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {shouldRender  && (
        <motion.div
          key="luxury-page-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: -24,
            filter: "blur(12px)",
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090D16] text-white select-none overflow-hidden touch-none overscroll-none"
        >
          {/* Ambient luminous glow circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse" />

          {/* Centered Brand Experience */}
          <div className="relative z-10 flex flex-col items-center space-y-7">
            {/* Pulsing Logo Monogram */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-3xl bg-white/[0.04] border border-white/[0.1] shadow-2xl backdrop-blur-xl p-4"
            >
              <div className="relative w-full h-full">
                <Image
                  src={CLOUDINARY_URLS.logo}
                  alt="Vijaya Kumar"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                  unoptimized
                />
              </div>

              {/* Glowing spinning perimeter ring */}
              <div className="absolute -inset-1 rounded-[28px] border border-blue-500/30 animate-[spin_6s_linear_infinite]" />
            </motion.div>

            {/* Title & Micro Tagline */}
            <div className="text-center space-y-1.5">
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-base sm:text-lg font-bold tracking-tight text-white font-heading"
              >
                Vijaya Kumar
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-xs text-zinc-400 font-mono tracking-wider uppercase"
              >
                Full Stack Software Developer
              </motion.p>
            </div>

            {/* Sleek Progress Bar & Dynamic Percentage */}
            <div className="w-56 sm:w-64 space-y-2.5">
              <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden p-[1px] border border-white/[0.06]">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  Loading portfolio...
                </span>
                <span className="text-zinc-300 font-bold">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
