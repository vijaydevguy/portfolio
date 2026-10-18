import HeroSection from "./components/HeroSection";
import ExperienceSection from "./components/ExperienceSection";
import ProjectsSection from "./components/ProjectsSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      {/* 1. Hero Section (bg-white) */}
      <HeroSection />

      {/* 2. Work Experience & Education Section (alternating bg-[#F8FAFC]) */}
      <ExperienceSection />

      {/* 3. Featured Projects Section (alternating bg-white) */}
      <ProjectsSection />
    </main>
  );
}
