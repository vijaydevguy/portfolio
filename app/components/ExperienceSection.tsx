"use client";

import { motion } from "framer-motion";
import { useExperienceData } from "../hooks/useExperienceData";
import { usePortfolioData } from "../context/PortfolioDataContext";
import {
  WORK_EXPERIENCE,
  EDUCATION as FALLBACK_EDUCATION,
} from "../data/experience";
import SectionHeading from "./ui/SectionHeading";

export default function ExperienceSection() {
  const { data: homeData, isLoading: contextLoading } = usePortfolioData();
  const { experiences: standaloneExp, education: standaloneEdu, educations: standaloneEdus, loading: standaloneLoading } = useExperienceData();

  const experiences = homeData?.experiences?.length ? homeData.experiences : standaloneExp;
  const educations = homeData?.educations?.length ? homeData.educations : standaloneEdus;
  const education = homeData?.education || standaloneEdu;
  const loading = experiences.length === 0 && (contextLoading || standaloneLoading);

  // Determine active list of experiences (use database if available, otherwise fallback)
  const displayExperiences =
    experiences && experiences.length > 0
      ? experiences
      : loading
        ? []
        : WORK_EXPERIENCE;

  // Multiple educations support
  const displayEducations =
    educations && educations.length > 0
      ? educations
      : education
        ? [education]
        : [FALLBACK_EDUCATION];

  return (
    <section
      id="experience"
      className="w-full bg-[#F8FAFC] py-20 lg:py-28 relative"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16">
          <SectionHeading
            badge="Career & Background"
            title="Work"
            highlightedText="Experience"
            description="My professional journey developing software, building full-stack products, and designing interfaces."
            alignment="center"
          />
        </div>

        {/* Experience Timeline */}
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="relative border-l-2 border-zinc-200 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8 animate-pulse">
              {[1, 2].map((idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] sm:-left-[47px] top-3 w-3.5 h-3.5 rounded-full bg-zinc-300 border-4 border-white shadow-xs" />
                  <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/80 bg-white space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-2">
                        <div className="h-5 bg-zinc-200 rounded-lg w-48" />
                        <div className="h-4 bg-zinc-100 rounded-md w-32" />
                      </div>
                      <div className="h-6 bg-zinc-100 rounded-full w-28" />
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="h-3.5 bg-zinc-100 rounded w-full" />
                      <div className="h-3.5 bg-zinc-100 rounded w-5/6" />
                      <div className="h-3.5 bg-zinc-100 rounded w-4/6" />
                    </div>
                  </div>
                </div>
              ))}
              {/* Education skeleton card */}
              <div className="pt-6">
                <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex-shrink-0" />
                    <div className="space-y-2 text-center sm:text-left w-full sm:w-auto">
                      <div className="h-4 bg-zinc-200 rounded w-24 mx-auto sm:mx-0" />
                      <div className="h-5 bg-zinc-200 rounded w-56 mx-auto sm:mx-0" />
                      <div className="h-3.5 bg-zinc-100 rounded w-40 mx-auto sm:mx-0" />
                    </div>
                  </div>
                  <div className="h-8 bg-zinc-200 rounded-full w-24" />
                </div>
              </div>
            </div>
          ) : displayExperiences.length > 0 ? (
            <div className="relative border-l-2 border-zinc-200 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8">
              {displayExperiences.map((exp, index) => (
                <motion.div
                  key={exp._id || (exp as any).id || index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative group"
                >
                  {/* Timeline Accent Node */}
                  <span className="absolute -left-[31px] sm:-left-[47px] top-2 w-3.5 h-3.5 rounded-full bg-white border-4 border-[#1D4ED8] shadow-xs group-hover:scale-125 transition-transform duration-200" />

                  {/* Clean Experience Card */}
                  <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-colors shadow-xs">
                    {/* Header Row: Role, Company & Period */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3.5">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-heading">
                          {exp.role}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-[#1D4ED8]">
                            {exp.company}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                            {exp.type}
                          </span>
                        </div>
                      </div>

                      {exp.period && (
                        <div className="sm:text-right mt-1 sm:mt-0">
                          <span className="text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full inline-block">
                            {exp.period}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description: Supports Rich Text HTML or array of bullet points */}
                    {typeof exp.description === "string" && exp.description.trim() ? (
                      <div
                        className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{ __html: exp.description }}
                      />
                    ) : Array.isArray(exp.description) && exp.description.length > 0 ? (
                      <ul className="space-y-1.5">
                        {exp.description.map((point: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm text-slate-600 flex items-start gap-2.5 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] mt-2 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No work experiences published yet.
            </div>
          )}

          {/* Education Highlight Card(s) (Supports 1 or more educations) */}
          {displayEducations.filter((edu) => edu.isVisible !== false).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
              className="pt-10 space-y-4"
            >
              {displayEducations
                .filter((edu) => edu.isVisible !== false)
                .map((edu, eIdx) => (
                  <div
                    key={edu._id || eIdx}
                    className="p-6 sm:p-8 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-[#1D4ED8] flex-shrink-0">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 14v7"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                          Education {displayEducations.length > 1 ? `#${eIdx + 1}` : ""}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-zinc-950 font-heading">
                          {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600">
                          {edu.institution}
                          {edu.location ? ` • ${edu.location}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-zinc-200/70 pt-3 sm:pt-0 sm:pl-6 flex-shrink-0">
                      <div className="text-center sm:text-right">
                        {edu.graduated && (
                          <span className="text-xs text-slate-500 block">
                            Graduated {edu.graduated}
                          </span>
                        )}
                        {edu.score && (
                          <span className="inline-flex items-center font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 text-xs mt-0.5">
                            {edu.score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
