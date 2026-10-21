"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { CLOUDINARY_URLS } from "../assets";
import { NAV_ITEMS } from "../common";
import { useHeroData } from "../hooks/useHeroData";
import { getCloudinaryUrl } from "../lib/cloudinary";
import { HERO_FALLBACK_DATA } from "../data/hero";

export default function Navbar() {
  const { data: heroData, loading } = useHeroData();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Dynamic Logo URL with centralized fallback
  const rawLogoSrc = heroData?.logoUrl || HERO_FALLBACK_DATA.logoUrl;
  const logoSrc = getCloudinaryUrl(rawLogoSrc);
  const logoAlt = heroData?.logoText ? `${heroData.logoText} Logo` : `${HERO_FALLBACK_DATA.logoText} Logo`;

  // Hide Navbar completely on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Framer Motion continuous scroll progress between 0px and 80px
  const { scrollY } = useScroll();

  // Continuous transformations linked directly to scroll position:
  // From 0px to 80px of scroll:
  // width: 80% -> 100%
  // maxWidth: 1150px -> 100vw
  // borderRadius: 9999px (full pill) -> 0px
  // top: 16px -> 0px
  // paddingX: 24px -> 40px
  const rawWidth = useTransform(scrollY, [0, 80], ["85%", "100%"]);
  const rawBorderRadius = useTransform(scrollY, [0, 80], [9999, 0]);
  const rawTop = useTransform(scrollY, [0, 80], [16, 0]);
  const rawShadow = useTransform(
    scrollY,
    [0, 80],
    [
      "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
      "0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
    ],
  );

  // Apply spring smoothing so fast wheel scrolling and reverse scrolling animate butter-smooth
  const springConfig = { stiffness: 260, damping: 28, mass: 0.5 };
  const smoothWidth = useSpring(rawWidth, springConfig);
  const smoothBorderRadius = useSpring(rawBorderRadius, springConfig);
  const smoothTop = useSpring(rawTop, springConfig);

  // Lock background body scroll when mobile/tab sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Fixed Navbar Container */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <motion.nav
          style={{
            width: smoothWidth,
            borderRadius: smoothBorderRadius,
            top: smoothTop,
            boxShadow: rawShadow,
          }}
          className="pointer-events-auto fixed flex items-center justify-between px-6 sm:px-10 py-3.5 border border-zinc-200/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150 transition-colors"
        >
          {/* Left Side: Dynamic Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={140}
              height={36}
              className="h-8 w-auto object-contain transition-transform duration-200 select-none pointer-events-none"
              priority
              unoptimized
            />
          </Link>

          {/* Right Side: Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 font-heading">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full ${
                    isActive
                      ? "text-zinc-950 font-semibold"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-zinc-950/5 border border-zinc-900/10 rounded-full shadow-xs"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Mobile / Tablet Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-100/80 text-zinc-900 transition-colors gap-1.5 focus:outline-none"
          >
            <span className="w-5 h-0.5 bg-zinc-900 rounded-full" />
            <span className="w-5 h-0.5 bg-zinc-900 rounded-full" />
            <span className="w-3.5 h-0.5 bg-zinc-900 rounded-full self-start ml-2.5" />
          </button>
        </motion.nav>
      </div>

      {/* Mobile & Tablet Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop: 20% Black Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-xs"
            />

            {/* Sidebar Sheet: 50% width on Mobile, 40% width on Tablet */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 h-full w-[50%] md:w-[40%] bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col z-50 border-l border-zinc-200/80"
            >
              {/* Sidebar Header: Dynamic Logo & Close Button */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-100/80">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={110}
                    height={30}
                    className="h-7 w-auto object-contain"
                    unoptimized
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close sidebar"
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 transition-colors focus:outline-none"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Sidebar Navigation Links */}
              <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto font-heading">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
                        isActive
                          ? "bg-zinc-950/5 text-zinc-950 font-semibold border-l-4 border-zinc-950"
                          : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                      }`}
                    >
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Sidebar Footer info */}
              <div className="p-5 border-t border-zinc-100 text-xs text-zinc-400">
                © {new Date().getFullYear()} Vijay Kumar
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
