"use client";

import Marquee from "react-fast-marquee";
import { useState, useRef, useEffect } from "react";
import { SKILLS_ROW_1, SKILLS_ROW_2, SkillItem } from "../data/skills";

function SkillChip({ skill }: { skill: SkillItem }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    // Show tooltip on mobile tap / click
    setShowTooltip(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 2200); // automatically hides after ~2.2 seconds
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowTooltip(false);
      }}
      aria-label={skill.name}
      className={`relative mx-6 sm:mx-8 md:mx-10 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center cursor-pointer select-none flex-shrink-0 group transition-all ${
        showTooltip ? "z-50" : "z-10"
      }`}
    >
      {/* Icon only - No card border / background */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-125">
        {skill.iconSvg}
      </div>

      {/* Floating Tooltip with Triangle Pointer (Visible on Desktop Hover & Mobile Click) */}
      <div
        className={`absolute -top-11 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white text-xs font-semibold whitespace-nowrap shadow-2xl transition-all duration-200 z-50 pointer-events-none ${
          showTooltip
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-90"
        }`}
      >
        <span>{skill.name}</span>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-950" />
      </div>
    </div>
  );
}

export default function SkillsSection() {
  return (
    <section
      id="skills"
      className="w-full bg-white py-12 relative overflow-hidden"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-[#1D4ED8] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
            Technical Proficiency
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 font-heading">
            Skills & <span className="text-[#1D4ED8]">Technologies</span>
          </h2>
        </div>
      </div>

      {/* 2-Row Smooth Marquee with react-fast-marquee */}
      <div className="relative w-full space-y-8 py-6">
        {/* Left & Right gradient fade masks matching pure white page background */}
        <div className="pointer-events-none absolute left-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-r from-white to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-l from-white to-transparent z-20" />

        {/* Row 1: Left to Right (direction="right") */}
        <div className="overflow-visible py-6">
          <Marquee
            direction="right"
            speed={45}
            pauseOnHover={true}
            gradient={false}
            autoFill={true}
            className="overflow-visible !overflow-visible"
          >
            {SKILLS_ROW_1.map((skill, index) => (
              <SkillChip key={`${skill.name}-${index}`} skill={skill} />
            ))}
          </Marquee>
        </div>

        {/* Row 2: Right to Left (direction="left") */}
        <div className="overflow-visible py-6">
          <Marquee
            direction="left"
            speed={45}
            pauseOnHover={true}
            gradient={false}
            autoFill={true}
            className="overflow-visible !overflow-visible"
          >
            {SKILLS_ROW_2.map((skill, index) => (
              <SkillChip key={`${skill.name}-${index}`} skill={skill} />
            ))}
          </Marquee>
        </div>
      </div>

      {/* Helpful hover indicator */}
      <div className="text-center mt-6">
        <span className="text-xs font-medium text-slate-400 inline-flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          Hover over any row to pause carousel
        </span>
      </div>
    </section>
  );
}
