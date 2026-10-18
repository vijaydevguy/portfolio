import HeroSection from "./components/HeroSection";
import ExperienceSection from "./components/ExperienceSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";
import ContactSection from "./components/ContactSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      {/* 1. Hero Section (bg-white) */}
      <HeroSection />

      {/* 2. Work Experience & Education Section (alternating bg-[#F8FAFC]) */}
      <ExperienceSection />

      {/* 3. Featured Projects Section (alternating bg-white) */}
      <ProjectsSection />

      {/* 4. Skills & Technologies Section (alternating bg-white) */}
      <SkillsSection />

      {/* 5. Contact Section (alternating bg-[#F8FAFC]) */}
      <ContactSection />
    </main>
  );
}
