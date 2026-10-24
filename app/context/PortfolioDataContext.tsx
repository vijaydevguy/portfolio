"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CONFIG } from "../common";
import { HeroSectionData } from "../hooks/useHeroData";
import { ProjectItem } from "../hooks/useProjectsData";
import { ProjectOptionItem } from "../hooks/useProjectOptions";
import { SkillItemData } from "../hooks/useSkillsData";
import { ExperienceItemData, EducationData } from "../hooks/useExperienceData";
import { CommonSettingsData, DEFAULT_COMMON_SETTINGS } from "../hooks/useCommonSettings";

export interface PortfolioHomeData {
  hero: HeroSectionData | null;
  projects: ProjectItem[];
  categories: ProjectOptionItem[];
  projectTypes: ProjectOptionItem[];
  skills: SkillItemData[];
  experiences: ExperienceItemData[];
  education: EducationData | null;
  educations: EducationData[];
  settings: CommonSettingsData;
}

interface PortfolioDataContextType {
  data: PortfolioHomeData;
  isLoading: boolean;
  isInitialLoad: boolean;
  refreshHomeData: () => Promise<void>;
}

const STORAGE_CACHE_KEY = "portfolio_home_cache_v1";

const DEFAULT_HOME_DATA: PortfolioHomeData = {
  hero: null,
  projects: [],
  categories: [],
  projectTypes: [],
  skills: [],
  experiences: [],
  education: null,
  educations: [],
  settings: DEFAULT_COMMON_SETTINGS,
};

const PortfolioDataContext = createContext<PortfolioDataContextType>({
  data: DEFAULT_HOME_DATA,
  isLoading: true,
  isInitialLoad: true,
  refreshHomeData: async () => {},
});

export function PortfolioDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PortfolioHomeData>(DEFAULT_HOME_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const hasLoadedFromCacheRef = React.useRef(false);

  // Restore from client-side cache immediately on mount
  useEffect(() => {
    if (hasLoadedFromCacheRef.current) return;
    hasLoadedFromCacheRef.current = true;

    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setData({
            ...DEFAULT_HOME_DATA,
            ...parsed,
            settings: parsed.settings || DEFAULT_COMMON_SETTINGS,
          });
          if (parsed.hero || parsed.projects?.length) {
            setIsLoading(false);
            setIsInitialLoad(false);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read portfolio home cache:", e);
    }
  }, []);

  // Parallel fetcher combining all home section endpoints with Promise.allSettled
  const fetchAllDataParallel = useCallback(async () => {
    const backendUrl = CONFIG.BACKEND_URL;

    try {
      const results = await Promise.allSettled([
        fetch(`${backendUrl}/api/sections/hero`).then((r) => r.json()),
        fetch(`${backendUrl}/api/projects?home=true&limit=3`).then((r) => r.json()),
        fetch(`${backendUrl}/api/project-options`).then((r) => r.json()),
        fetch(`${backendUrl}/api/skills`).then((r) => r.json()),
        fetch(`${backendUrl}/api/experiences`).then((r) => r.json()),
        fetch(`${backendUrl}/api/settings/common`).then((r) => r.json()),
      ]);

      const [heroRes, projectsRes, optionsRes, skillsRes, expRes, settingsRes] = results;

      setData((prev) => {
        const updated: PortfolioHomeData = { ...prev };

        if (heroRes.status === "fulfilled" && heroRes.value?.success && heroRes.value.data) {
          updated.hero = heroRes.value.data;
        }

        if (projectsRes.status === "fulfilled" && projectsRes.value?.success && Array.isArray(projectsRes.value.data)) {
          updated.projects = projectsRes.value.data;
        }

        if (optionsRes.status === "fulfilled" && optionsRes.value?.success && Array.isArray(optionsRes.value.data)) {
          const allOptions: ProjectOptionItem[] = optionsRes.value.data;
          updated.categories = allOptions.filter((o) => o.type === "category");
          updated.projectTypes = allOptions.filter((o) => o.type === "projectType");
        }

        if (skillsRes.status === "fulfilled" && skillsRes.value?.success && Array.isArray(skillsRes.value.data)) {
          updated.skills = skillsRes.value.data;
        }

        if (expRes.status === "fulfilled" && expRes.value?.success && expRes.value.data) {
          const expData = expRes.value.data;
          updated.experiences = Array.isArray(expData.experiences) ? expData.experiences : [];
          updated.educations = Array.isArray(expData.educations) ? expData.educations : [];
          updated.education = expData.education || updated.educations[0] || null;
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value?.success && settingsRes.value.data) {
          updated.settings = {
            ...DEFAULT_COMMON_SETTINGS,
            ...settingsRes.value.data,
          };
        }

        // Cache the latest snapshot in localStorage for 0ms loads on future visits
        try {
          localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));
        } catch (storageErr) {
          console.warn("Could not write portfolio home cache to localStorage:", storageErr);
        }

        return updated;
      });
    } catch (err) {
      console.error("Parallel bootstrap fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial parallel fetch
    fetchAllDataParallel();
  }, [fetchAllDataParallel]);

  return (
    <PortfolioDataContext.Provider
      value={{
        data,
        isLoading,
        isInitialLoad,
        refreshHomeData: fetchAllDataParallel,
      }}
    >
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData() {
  return useContext(PortfolioDataContext);
}
