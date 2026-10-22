import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  projectTitle: string;
}

export default function ProjectImageModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  projectTitle,
}: ProjectImageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<"detail" | "grid">("detail");
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setViewMode("detail");
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" && viewMode === "detail") {
        goToPrev();
      } else if (e.key === "ArrowRight" && viewMode === "detail") {
        goToNext();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, viewMode, isZoomed, onClose, images.length]);

  const goToPrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  if (!isOpen || !images || images.length === 0 || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${projectTitle} Gallery`}
      className="fixed inset-0 z-[99999] flex flex-col bg-zinc-950/98 backdrop-blur-xl select-none text-white animate-in fade-in duration-200"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-zinc-800/80 bg-zinc-900/90 z-30 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold truncate text-zinc-100 font-heading">
              {projectTitle}
            </h3>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span>{images.length} {images.length === 1 ? "Screenshot" : "Screenshots"}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-medium">Full HD / Actual View</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle View Mode: Viewer vs Gallery Grid */}
          <div className="inline-flex rounded-xl bg-zinc-800/90 p-1 border border-zinc-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setViewMode("detail");
                setIsZoomed(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "detail"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span>Single View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setIsZoomed(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Gallery Grid</span>
            </button>
          </div>

          {/* Open Original in New Tab */}
          {/* <a
            href={images[currentIndex]}
            target="_blank"
            rel="noopener noreferrer"
            title="Open raw image in new tab"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Raw Link</span>
          </a> */}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-rose-600/90 hover:text-white text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-zinc-700/60"
            title="Press Esc or click to close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "detail" ? (
        <div className="relative flex-1 flex flex-col items-center justify-between min-h-0 p-3 sm:p-5 overflow-hidden">
          {/* Main active image in actual view */}
          <div
            className={`relative w-full flex-1 flex items-center justify-center transition-all duration-200 select-none ${
              isZoomed ? "overflow-auto cursor-zoom-out" : "cursor-zoom-in overflow-hidden"
            }`}
            onClick={() => setIsZoomed((prev) => !prev)}
            title={isZoomed ? "Click to fit screen" : "Click to view full unscaled size"}
          >
            <div className={`relative ${isZoomed ? "w-auto h-auto max-w-none" : "w-full h-full max-h-[calc(100vh-190px)] flex items-center justify-center"}`}>
              <img
                src={images[currentIndex]}
                alt={`${projectTitle} screenshot ${currentIndex + 1}`}
                className={`rounded-xl shadow-2xl transition-all duration-200 ${
                  isZoomed
                    ? "max-w-none object-contain"
                    : "max-h-[calc(100vh-200px)] max-w-full object-contain mx-auto"
                }`}
              />
            </div>
          </div>

          {/* Navigation Arrows (for multiple images) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous screenshot"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/85 hover:bg-zinc-800 text-white border border-zinc-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next screenshot"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/85 hover:bg-zinc-800 text-white border border-zinc-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Footer Controls & Thumbnail Strip */}
          <div className="w-full max-w-5xl mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 z-20">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-200 font-semibold font-mono">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isZoomed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  )}
                </svg>
                <span>{isZoomed ? "Reset Zoom" : "Actual 100% Zoom"}</span>
              </button>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsZoomed(false);
                      setCurrentIndex(idx);
                    }}
                    className={`relative w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      currentIndex === idx
                        ? "border-blue-500 ring-2 ring-blue-500/40 scale-105 shadow-md shadow-blue-500/20"
                        : "border-zinc-700/80 opacity-50 hover:opacity-100 hover:border-zinc-500"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Enhanced Gallery Grid View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Gallery Intro Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-heading">
                  Showcase Gallery ({images.length} High-Res {images.length === 1 ? "Image" : "Images"})
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Click on any project screenshot to inspect it in full actual resolution.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                High Fidelity Screen Captures
              </span>
            </div>

            {/* Responsive Media Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-12">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode("detail");
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-blue-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col"
                >
                  {/* Aspect Ratio Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                    <Image
                      src={img}
                      alt={`${projectTitle} screenshot ${idx + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient & Hover Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center p-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span>Inspect Actual Size</span>
                      </span>
                    </div>

                    {/* Corner Image Index Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-zinc-950/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold font-mono">
                      #{idx + 1}
                    </div>
                  </div>

                  {/* Card Sub-bar */}
                  <div className="p-3.5 bg-zinc-900/90 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate">
                      Screenshot {idx + 1}
                    </span>
                    <span className="text-blue-400 group-hover:text-blue-300 font-semibold flex items-center gap-1">
                      <span>View</span>
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
