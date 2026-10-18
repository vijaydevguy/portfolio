"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PROJECTS_DATA, ProjectItem } from "../data/projects";
import ProjectCard from "./ProjectCard";
import SectionHeading from "./ui/SectionHeading";

const CATEGORIES = ["All", "Development", "UI / UX Design"] as const;

export default function ProjectsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProjects =
    activeCategory === "All"
      ? PROJECTS_DATA
      : PROJECTS_DATA.filter((p) => p.category === activeCategory);

  const displayedProjects = filteredProjects.slice(0, 3);

  return (
    <section id="projects" className="w-full bg-white py-20 lg:py-28 relative">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Category Filter */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <SectionHeading
            badge="Featured Work"
            title="Selected"
            highlightedText="Projects"
            description="A curated collection of full-stack platforms, modern web applications, and UI/UX systems."
            alignment="left"
          />

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 self-start md:self-auto font-heading">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  <span className="relative z-10">{cat}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-white rounded-xl border border-zinc-200/80"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Cards Grid (Top 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.map((project: ProjectItem) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* More Projects Redirection CTA */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-zinc-950 text-white font-semibold text-sm hover:bg-zinc-800 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <span>View All Projects</span>
            {/* <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {PROJECTS_DATA.length}
            </span> */}
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
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
        </div>
      </div>
    </section>
  );
}
