"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectCarouselProps {
  images: string[];
  title: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export default function ProjectCarousel({
  images,
  title,
}: ProjectCarouselProps) {
  const [[page, direction], setPage] = useState([0, 0]);

  if (!images || images.length === 0) return null;

  const imageIndex = ((page % images.length) + images.length) % images.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const jumpTo = (idx: number) => {
    setPage([idx, idx > imageIndex ? 1 : -1]);
  };

  return (
    <div className="space-y-4">
      {/* Main Large Carousel Viewport */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-950 shadow-lg select-none">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 || offset.x < -100) {
                paginate(1);
              } else if (swipe > 10000 || offset.x > 100) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            <Image
              src={images[imageIndex]}
              alt={`${title} Preview ${imageIndex + 1}`}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top"
            />
          </motion.div>
        </AnimatePresence>

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all hover:scale-105 backdrop-blur-md focus:outline-none"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all hover:scale-105 backdrop-blur-md focus:outline-none"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Current Slide Counter Badge */}
        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-zinc-950/60 backdrop-blur-md text-white text-xs font-semibold tracking-wider">
          {imageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => jumpTo(idx)}
            className={`relative aspect-[16/10] w-24 sm:w-32 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
              imageIndex === idx
                ? "border-[#1D4ED8] shadow-md ring-2 ring-blue-100 scale-102"
                : "border-zinc-200 opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              fill
              sizes="128px"
              className="object-cover object-top"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
