"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectItem } from "../hooks/useProjectsData";

export default function ProjectCard({ project }: { project: ProjectItem }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const previewImages = project?.previewImages || [];
  const imagesCount = previewImages.length;
  const projectKey = (project?._id || project?.id || project?.slug || "project").toString();

  // Staggered asynchronous random interval so cards rotate independently
  useEffect(() => {
    if (isHovered || imagesCount <= 1) return;

    const baseDelay = 4200;
    const randomOffset = (projectKey.charCodeAt(0) * 600) % 2500;
    const intervalTime = baseDelay + randomOffset;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % imagesCount);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [imagesCount, isHovered, projectKey]);

  const activeImage =
    previewImages[activeImageIndex] || previewImages[0] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col w-full rounded-2xl overflow-hidden border border-zinc-200/90 bg-white shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all duration-300"
    >
      {/* 1. Image Carousel Container (Top Part) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImageIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {activeImage ? (
              <Image
                src={activeImage}
                alt={`${project.title} Preview ${activeImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 bg-zinc-100">
                No preview image
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Subtle top vignette gradient for badge visibility */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/35 via-black/10 to-transparent pointer-events-none z-10" />

        {/* Top-Left: Project Type Badge (Hidden when Personal as per design preference) */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
          {project.projectType === "Personal" ? null : (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
                project.projectType === "Professional"
                  ? "bg-blue-950/75 text-blue-100 border-blue-400/30"
                  : "bg-emerald-950/75 text-emerald-100 border-emerald-400/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  project.projectType === "Professional"
                    ? "bg-blue-400"
                    : "bg-emerald-400"
                }`}
              />
              {project.projectType === "Professional"
                ? "Professional"
                : "Personal"}
            </span>
          )}
        </div>

        {/* Top-Right: Image Dots Indicator */}
        {previewImages.length > 1 && (
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-sm">
            {previewImages.slice(0, 3).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                aria-label={`View preview ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImageIndex === idx
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Details Section (Bottom Part - Cleanly Separated) */}
      <div className="flex flex-col flex-1 p-5 bg-white justify-between gap-4">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-heading leading-snug group-hover:text-[#1D4ED8] transition-colors">
          {project.title}
        </h3>

        {/* Action Links */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          {project.hasDetailPage ? (
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1D4ED8] hover:text-blue-700 transition-colors group/link"
            >
              <span>View Project</span>
              <svg
                className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          ) : (
            <span className="text-xs text-zinc-400 font-medium">
              Internal Asset
            </span>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Live Demo</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
