import React from "react";

interface SectionHeadingProps {
  badge: string;
  title: string;
  highlightedText: string;
  description?: string;
  alignment?: "left" | "center";
}

/**
 * Reusable SectionHeading Component
 * Enforces DRY design system standards across all portfolio sections
 */
export default function SectionHeading({
  badge,
  title,
  highlightedText,
  description,
  alignment = "left",
}: SectionHeadingProps) {
  const isCenter = alignment === "center";

  return (
    <div
      className={`space-y-3 ${
        isCenter
          ? "flex flex-col items-center text-center max-w-2xl mx-auto"
          : "max-w-xl text-left"
      }`}
    >
      <span className="text-xs uppercase tracking-widest text-[#1D4ED8] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 inline-block select-none">
        {badge}
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 font-heading leading-tight">
        {title} <span className="text-[#1D4ED8]">{highlightedText}</span>
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
