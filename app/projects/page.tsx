"use client";

import Link from "next/link";
import { useProjectsData, ProjectItem } from "@/app/hooks/useProjectsData";
import ProjectCard from "@/app/components/ProjectCard";

export default function AllProjectsPage() {
  const { projects, loading } = useProjectsData("All");

  return (
    <div className="w-full bg-white min-h-screen py-10 lg:py-16">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header: Back Button + Title on the same line */}
        <div className="flex items-center gap-3.5 border-b border-zinc-200/80 pb-5">
          <Link
            href="/#projects"
            aria-label="Back to home"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950 transition-colors group flex-shrink-0"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-heading">
            All Projects
          </h1>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 space-y-4 animate-pulse shadow-xs"
              >
                <div className="aspect-[16/10] bg-zinc-100 rounded-xl w-full" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-zinc-200 rounded w-1/3" />
                  <div className="h-6 bg-zinc-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project: ProjectItem) => (
              <ProjectCard key={project._id || project.id || project.slug} project={project as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 font-medium">
            No projects available yet.
          </div>
        )}
      </div>
    </div>
  );
}
