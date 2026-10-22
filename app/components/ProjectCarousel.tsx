"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import ProjectImageModal from "@/app/components/ui/ProjectImageModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const imageIndex = ((page % images.length) + images.length) % images.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const jumpTo = (idx: number) => {
    setPage([idx, idx > imageIndex ? 1 : -1]);
  };

  const openModalAt = (idx: number) => {
    setModalInitialIndex(idx);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Large Carousel Viewport */}
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-950 shadow-lg select-none">
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
            onClick={() => openModalAt(imageIndex)}
            className="absolute inset-0 w-full h-full cursor-pointer"
            title="Click to view image in full actual view"
          >
            <Image
              src={images[imageIndex]}
              alt={`${title} Preview ${imageIndex + 1}`}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </motion.div>
        </AnimatePresence>

        {/* View Actual Size Overlay Badge (Top Left) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openModalAt(imageIndex);
          }}
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950/75 hover:bg-zinc-950 text-white text-xs font-semibold backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <span>Actual View</span>
        </button>

        {/* Previous Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            paginate(-1);
          }}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all hover:scale-105 backdrop-blur-md focus:outline-none cursor-pointer"
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
          onClick={(e) => {
            e.stopPropagation();
            paginate(1);
          }}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all hover:scale-105 backdrop-blur-md focus:outline-none cursor-pointer"
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

        {/* Current Slide Counter & Full Gallery Action Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModalAt(imageIndex);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Gallery View</span>
          </button>
          <div className="px-3 py-1 rounded-full bg-zinc-950/60 backdrop-blur-md text-white text-xs font-semibold tracking-wider">
            {imageIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => jumpTo(idx)}
            className={`relative aspect-[16/10] w-24 sm:w-32 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
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

      {/* Full Resolution Actual View & Gallery Modal */}
      <ProjectImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={images}
        initialIndex={modalInitialIndex}
        projectTitle={title}
      />
    </div>
  );
}
