import Image from "next/image";
import { CLOUDINARY_URLS } from "../assets";
import { CONFIG } from "../common";

export default function HeroSection() {
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
                Software <span className="text-[#1D4ED8]">Developer</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-normal">
                Crafting scalable, high-performance web applications and
                intuitive digital experiences.
              </p>
            </div>

            {/* Hero CTA Actions: Resume Download & Contact Navigation */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Resume Download CTA (Direct Google Drive Download) */}
              <a
                href={CONFIG.RESUME_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 active:bg-blue-800 text-white font-heading font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
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
                <span>Download Resume</span>
              </a>

              {/* Contact Navigation CTA */}
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 active:bg-zinc-200 text-zinc-800 font-heading font-semibold text-sm transition-all cursor-pointer"
              >
                <span>Get in Touch</span>
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
                src={CLOUDINARY_URLS.hero_img}
                alt="Software Developer Workspace Illustration"
                width={640}
                height={520}
                className="w-full h-auto object-contain drop-shadow-md select-none pointer-events-none"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
