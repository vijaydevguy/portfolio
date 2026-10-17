import Image from "next/image";
import { CLOUDINARY_URLS } from "../assets";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20  flex items-center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
        {/* Left Column: Heading, Subtext & Actions (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 font-heading leading-[1.15]">
              Software <span className="text-[#1D4ED8]">Developer</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-normal">
              Crafting scalable, high-performance web applications and intuitive
              digital experiences.
            </p>
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
    </section>
  );
}
