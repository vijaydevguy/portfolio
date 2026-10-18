import Link from "next/link";
import { PROJECTS_DATA, ProjectItem } from "@/app/data/projects";
import ProjectCard from "@/app/components/ProjectCard";

export default function AllProjectsPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS_DATA.map((project: ProjectItem) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
