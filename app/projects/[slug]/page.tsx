import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PROJECTS_DATA, ProjectItem } from "@/app/data/projects";
import ProjectCarousel from "@/app/components/ProjectCarousel";

import { CONFIG } from "@/app/common";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return PROJECTS_DATA.filter((p) => p.hasDetailPage).map((p) => ({
    slug: p.slug,
  }));
}

async function getProject(slug: string): Promise<ProjectItem | null> {
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/detail/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch {
    // Fallback to local static data
  }
  return PROJECTS_DATA.find((p) => p.slug === slug) || null;
}

async function ProjectDetailContent({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project || !project.hasDetailPage) {
    notFound();
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb / Back Link */}
      <div className="mb-6 lg:mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-zinc-950 transition-colors group"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Split Layout: Left Sticky Preview + Right Scrollable Details on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Sticky Media & Showcase Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <ProjectCarousel
            images={project.previewImages}
            title={project.title}
          />

          {/* Quick Meta Footer below gallery for desktop view */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click any image for actual full-screen view
            </span>
            <span>{project.previewImages.length} screens available</span>
          </div>
        </div>

        {/* Right Side: Scrollable Details & Case Information */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          {/* Header & Badges */}
          <div className="space-y-4 pb-6 border-b border-zinc-200/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#1D4ED8] px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                {project.category}
              </span>
              {project.role && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">
                  {project.role}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 font-heading leading-tight">
              {project.title}
            </h1>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  <span>Visit Live App</span>
                  <svg
                    className="w-4 h-4"
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

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-sm transition-all border border-zinc-200"
                >
                  <span>View Source</span>
                </a>
              )}
            </div>
          </div>

          {/* Overview Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overview
            </h2>
            {project.overview && /<[a-z][\s\S]*>/i.test(project.overview) ? (
              <div
                className="prose prose-zinc max-w-none text-slate-700 text-base sm:text-lg leading-relaxed [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>h3]:text-zinc-900 [&>h3]:font-bold [&>h3]:text-lg [&>h3]:mt-4 [&>h3]:mb-2"
                dangerouslySetInnerHTML={{ __html: project.overview }}
              />
            ) : (
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-line">
                {project.overview || project.shortDescription}
              </p>
            )}
          </div>

          {/* Technologies Stack */}
          <div className="space-y-3 pt-4 border-t border-zinc-200/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Technologies Used
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Key Features & Architecture */}
          <div className="space-y-4 pt-4 border-t border-zinc-200/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Key Features & Architecture
            </h2>
            {project.keyFeatures ? (
              typeof project.keyFeatures === "string" ? (
                <div
                  className="prose prose-zinc max-w-none text-slate-600 text-sm sm:text-base leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>h3]:text-zinc-900 [&>h3]:font-bold [&>h3]:text-base [&>p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: project.keyFeatures }}
                />
              ) : Array.isArray(project.keyFeatures) ? (
                <ul className="space-y-3.5">
                  {project.keyFeatures.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-600 text-sm sm:text-base leading-relaxed"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1D4ED8] mt-2 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              ) : null
            ) : (
              <p className="text-slate-600 text-sm">
                Details available upon request.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage(props: ProjectPageProps) {
  return (
    <article className="w-full bg-white min-h-screen py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-[1200px] mx-auto px-4 py-20 text-center text-slate-400">
            Loading project details...
          </div>
        }
      >
        <ProjectDetailContent {...props} />
      </Suspense>
    </article>
  );
}
