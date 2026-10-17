import HeroSection from "./components/HeroSection";
import ExperienceSection from "./components/ExperienceSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      {/* 1. Hero Section (bg-white) */}
      <HeroSection />

      {/* 2. Work Experience & Education Section (alternating bg-zinc-50/70 with hairline highlight) */}
      <ExperienceSection />
    </main>
  );
}

