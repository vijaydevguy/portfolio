"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectOptions } from "@/app/hooks/useProjectOptions";
import { ProjectItem } from "@/app/hooks/useProjectsData";
import { CONFIG } from "@/app/common";
import ProjectCard from "@/app/components/ProjectCard";

const PAGE_LIMIT = 6;

export default function AllProjectsPage() {
  const { categories, projectTypes } = useProjectOptions();

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProjectType, setSelectedProjectType] = useState("All");

  // Sidebar filter drawer state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Backend pagination state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Sentinel ref for IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lock body scroll when filter drawer is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFilterOpen]);

  // Dynamic filter lists from DB
  const categoryOptions = useMemo(() => {
    const list = ["All", ...categories.map((c) => c.name)];
    return Array.from(new Set(list));
  }, [categories]);

  const projectTypeOptions = useMemo(() => {
    const list = ["All", ...projectTypes.map((pt) => pt.name)];
    return Array.from(new Set(list));
  }, [projectTypes]);

  // Active filters count for badge on filter icon
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count += 1;
    if (selectedProjectType !== "All") count += 1;
    return count;
  }, [selectedCategory, selectedProjectType]);

  // Fetch projects from backend with page, limit, category, projectType, and search query
  const fetchPage = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", targetPage.toString());
        params.set("limit", PAGE_LIMIT.toString());

        if (selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }
        if (selectedProjectType !== "All") {
          params.set("projectType", selectedProjectType);
        }
        if (debouncedQuery.trim()) {
          params.set("search", debouncedQuery.trim());
        }

        const url = `${CONFIG.BACKEND_URL}/api/projects?${params.toString()}`;
        const res = await fetch(url);
        const json = await res.json();

        if (res.ok && json.success && Array.isArray(json.data)) {
          setProjects((prev) => (append ? [...prev, ...json.data] : json.data));
          setHasMore(Boolean(json.hasMore));
          setTotal(json.total ?? json.data.length);
          setPage(targetPage);
        }
      } catch (err) {
        console.error("Error fetching paginated projects:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, selectedProjectType, debouncedQuery]
  );

  // Trigger new fetch from page 1 whenever filters or search query change
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  // IntersectionObserver: automatically loads next page from backend when sentinel enters viewport
  useEffect(() => {
    if (!hasMore || loading || isLoadingMore) return;

    const currentTarget = loadMoreRef.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore && !loading) {
          fetchPage(page + 1, true);
        }
      },
      {
        root: null,
        rootMargin: "250px", // Pre-fetch next page 250px before user hits absolute bottom
        threshold: 0.1,
      }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, isLoadingMore, page, fetchPage]);

  const isFiltered =
    selectedCategory !== "All" ||
    selectedProjectType !== "All" ||
    debouncedQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedProjectType("All");
    setSearchInput("");
    setDebouncedQuery("");
  };

  return (
    <div className="w-full bg-white min-h-screen py-10 lg:py-16">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Unified Top Header Bar: Left Side (Title + Desc), Right Side (Debounced Search + Filter Drawer Button) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200/80 pb-6">
          {/* Left Side: Back Arrow, Title, Subtitle */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/#projects"
              aria-label="Back to home"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950 transition-colors group flex-shrink-0 cursor-pointer"
            >
              <svg
                className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-heading truncate">
                All Projects
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                Explore complete portfolio of engineering architectures and applications
              </p>
            </div>
          </div>

          {/* Right Side: Search Box + Filter Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search projects or tech..."
                className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200/90 rounded-2xl text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs font-medium"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedQuery("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-zinc-700 cursor-pointer"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                activeFiltersCount > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/80"
                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
              }`}
            >
              <svg
                className={`w-4 h-4 ${activeFiltersCount > 0 ? "text-blue-600" : "text-zinc-600"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Tags Bar */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-400">Active:</span>

            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
                <span>Category: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="hover:text-blue-950 cursor-pointer font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {selectedProjectType !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800">
                <span>Type: {selectedProjectType}</span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectType("All")}
                  className="hover:text-zinc-950 cursor-pointer font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {debouncedQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                <span>Query: &ldquo;{debouncedQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedQuery("");
                  }}
                  className="hover:text-amber-950 cursor-pointer font-bold"
                >
                  ×
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 space-y-4 animate-pulse shadow-xs"
              >
                <div className="aspect-[16/10] bg-zinc-100 rounded-xl w-full" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-zinc-200 rounded w-1/3" />
                  <div className="h-6 bg-zinc-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project: ProjectItem) => (
                <ProjectCard
                  key={project._id || project.id || project.slug}
                  project={project as any}
                />
              ))}
            </div>

            {/* IntersectionObserver Sentinel & Loading Indicator */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="w-full py-8 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-7 h-7 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
                <span className="text-xs text-slate-400 font-medium tracking-wide">
                  Loading more projects...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-200/80 flex items-center justify-center mx-auto text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900">
              No projects match your criteria
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, clearing project type, or changing category.
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer mt-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Filter Drawer (Modal / Sidebar) */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[99999] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 font-heading">
                      Filter Projects
                    </h3>
                    <p className="text-xs text-slate-500">
                      Refine by category & project type
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-7">
                {/* 1. Category Options */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                          }`}
                        >
                          {cat === "All" ? "All Categories" : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Project Type Options */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Project Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projectTypeOptions.map((pt) => {
                      const isActive = selectedProjectType === pt;
                      return (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setSelectedProjectType(pt)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                            isActive
                              ? "bg-zinc-950 border-zinc-950 text-white shadow-sm"
                              : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                          }`}
                        >
                          {pt === "All" ? "All Types" : pt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedProjectType("All");
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
