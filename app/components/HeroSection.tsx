"use client";

import Image from "next/image";
import { CLOUDINARY_URLS } from "../assets";
import { CONFIG } from "../common";
import { useHeroData } from "../hooks/useHeroData";
import { usePortfolioData } from "../context/PortfolioDataContext";
import { getCloudinaryUrl, getCloudinaryDownloadUrl, normalizeResumeUrl } from "../lib/cloudinary";
import { HERO_FALLBACK_DATA } from "../data/hero";

export default function HeroSection() {
  const { data: homeData, isLoading: contextLoading } = usePortfolioData();
  const { data: standaloneHeroData, loading: standaloneLoading } = useHeroData();

  // Use fast cached/parallel context data if available, otherwise standalone
  const heroData = homeData?.hero || standaloneHeroData;
  // Section visibility: if explicitly set to false in fetched DB, hide it
  if (heroData?.isVisible === false) {
    return null;
  }

  // Values from API, falling back cleanly to centralized HERO_FALLBACK_DATA
  const titlePrefix = heroData?.titlePrefix || HERO_FALLBACK_DATA.titlePrefix;
  const titleHighlight =
    heroData?.titleHighlight || HERO_FALLBACK_DATA.titleHighlight;
  const subtitle = heroData?.subtitle || HERO_FALLBACK_DATA.subtitle;

  // const isBrokenHeroUrl =
  //   heroData?.heroImageUrl &&
  //   (heroData.heroImageUrl.includes("v1773030225") ||
  //     heroData.heroImageUrl.includes("portfolio_app/hero_img.webp"));

  // const rawHeroImg =
  //   !isBrokenHeroUrl && heroData?.heroImageUrl
  //     ? heroData.heroImageUrl
  //     : HERO_FALLBACK_DATA.heroImageUrl;
  // const heroImg = getCloudinaryUrl(rawHeroImg);

  const rawHeroImg = getCloudinaryUrl(
    "https://res.cloudinary.com/dtgn3hnzh/image/upload/v1792417439/user_6ad58de963f484bc645d5e3e/hero/illustration/file_hq2zoj.png",
  );
  const heroImg = getCloudinaryUrl(rawHeroImg);

  const resumes =
    heroData?.resumes && heroData.resumes.length > 0
      ? heroData.resumes
      : HERO_FALLBACK_DATA.resumes;
  const ctaContactText =
    heroData?.ctaContactText || HERO_FALLBACK_DATA.ctaContactText;
  const ctaContactHref =
    heroData?.ctaContactHref || HERO_FALLBACK_DATA.ctaContactHref;

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
                {titlePrefix}{" "}
                <span className="text-[#1D4ED8]">{titleHighlight}</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-normal">
                {subtitle}
              </p>
            </div>

            {/* Hero CTA Actions: Resumes & Contact Navigation */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              {/* Dynamic Resumes (Capped at 3) */}
              {resumes.map((resume, idx) => {
                const rawUrl = resume.url?.trim() || "";
                
                // Cloudinary flow commented out as requested; directly use normalized URL (Google Drive / Direct link)
                // const isPdf =
                //   rawUrl.toLowerCase().endsWith(".pdf") ||
                //   rawUrl.includes(".pdf");
                // const downloadUrl = isPdf
                //   ? getCloudinaryDownloadUrl(
                //       rawUrl,
                //       `${(resume.label || "Resume").replace(/\s+/g, "_")}.pdf`,
                //     )
                //   : normalizeResumeUrl(rawUrl) || CONFIG.RESUME_DOWNLOAD_URL;

                // Placeholder fallback commented out as requested; use actual entered URL
                // const downloadUrl = normalizeResumeUrl(rawUrl) || CONFIG.RESUME_DOWNLOAD_URL;
                const downloadUrl = normalizeResumeUrl(rawUrl);
                const isDirectPdf = rawUrl.toLowerCase().endsWith(".pdf");

                if (!downloadUrl) return null;

                return (
                  <a
                    key={idx}
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={isDirectPdf ? `${(resume.label || "Resume").replace(/\s+/g, "_")}.pdf` : undefined}
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
