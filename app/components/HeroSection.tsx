"use client";

import Image from "next/image";
import { CLOUDINARY_URLS } from "../assets";
import { CONFIG } from "../common";
import { useHeroData } from "../hooks/useHeroData";
import { getCloudinaryUrl, getCloudinaryDownloadUrl } from "../lib/cloudinary";

export default function HeroSection() {
  const { data: heroData, loading } = useHeroData();

  // If loading, render an elegant skeleton so we never flash fallback defaults
  if (loading) {
    return (
      <section
        id="hero"
        className="w-full bg-white pt-10 pb-16 lg:pt-16 lg:pb-24 animate-pulse"
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start space-y-6">
              <div className="space-y-4 w-full flex flex-col items-center lg:items-start">
                <div className="h-12 sm:h-14 bg-zinc-200/80 rounded-2xl w-3/4 max-w-md" />
                <div className="h-5 bg-zinc-200/70 rounded-lg w-full max-w-lg mt-2" />
                <div className="h-5 bg-zinc-200/60 rounded-lg w-2/3 max-w-sm" />
              </div>
              <div className="flex flex-wrap gap-3.5 pt-4">
                <div className="h-12 w-44 bg-zinc-200/80 rounded-xl" />
                <div className="h-12 w-36 bg-zinc-200/70 rounded-xl" />
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md h-80 bg-zinc-100 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If section visibility is disabled by admin, don't render it
  if (heroData?.isVisible === false) {
    return null;
  }

  // Values from API, only falling back if API didn't provide a specific field
  const titlePrefix = heroData?.titlePrefix || "Software";
  const titleHighlight = heroData?.titleHighlight || "Developer";
  const subtitle =
    heroData?.subtitle ||
    "Crafting scalable, high-performance web applications and intuitive digital experiences.";
  const rawHeroImg = heroData?.heroImageUrl || CLOUDINARY_URLS.hero_img;
  const heroImg = getCloudinaryUrl(rawHeroImg);
  const resumes =
    heroData?.resumes && heroData.resumes.length > 0
      ? heroData.resumes
      : [
          {
            label: "Download Resume",
            url: CONFIG.RESUME_DOWNLOAD_URL,
            isPrimary: true,
          },
        ];
  const ctaContactText = heroData?.ctaContactText || "Get in Touch";
  const ctaContactHref = heroData?.ctaContactHref || "#contact";

  return (
    <section
      id="hero"
      className="w-full bg-white pt-10 pb-16 lg:pt-16 lg:pb-24"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* Left Column: Heading, Subtext & Actions (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 font-heading leading-[1.15]">
                {titlePrefix} <span className="text-[#1D4ED8]">{titleHighlight}</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-normal">
                {subtitle}
              </p>
            </div>

            {/* Hero CTA Actions: Resumes & Contact Navigation */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              {/* Dynamic Resumes (Capped at 3) */}
              {resumes.map((resume, idx) => {
                const isPdf = (resume.url || "").toLowerCase().endsWith(".pdf") || (resume.url || "").includes(".pdf");
                const downloadUrl = isPdf
                  ? getCloudinaryDownloadUrl(resume.url, `${(resume.label || "Resume").replace(/\s+/g, "_")}.pdf`)
                  : (resume.url || CONFIG.RESUME_DOWNLOAD_URL);

                return (
                  <a
                    key={idx}
                    href={downloadUrl}
                    download={`${(resume.label || "Resume").replace(/\s+/g, "_")}.pdf`}
                    className={
                      resume.isPrimary || idx === 0
                        ? "btn-primary !rounded-xl !py-3.5 !font-heading !font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                        : "btn-secondary !rounded-xl !py-3.5 !font-heading !font-semibold"
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    <span>{resume.label || "Download Resume"}</span>
                  </a>
                );
              })}

              {/* Contact Navigation CTA */}
              <a
                href={ctaContactHref}
                className="btn-secondary !rounded-xl !py-3.5 !font-heading !font-semibold"
              >
                <span>{ctaContactText}</span>
                <svg
                  className="w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Illustration (5 cols on lg) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none">
              <Image
                src={heroImg}
                alt={`${titlePrefix} ${titleHighlight} Illustration`}
                width={640}
                height={520}
                className="w-full h-auto object-contain drop-shadow-md select-none pointer-events-none"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
