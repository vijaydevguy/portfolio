"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface ProjectOptionItem {
  _id: string;
  type: "category" | "projectType";
  name: string;
  order: number;
  isDefault?: boolean;
}

const DEFAULT_CATEGORIES: ProjectOptionItem[] = [
  { _id: "cat-dev", type: "category", name: "Development", order: 1, isDefault: true },
  { _id: "cat-uiux", type: "category", name: "UI / UX Design", order: 2, isDefault: false },
];

const DEFAULT_PROJECT_TYPES: ProjectOptionItem[] = [
  { _id: "pt-prof", type: "projectType", name: "Professional", order: 1, isDefault: false },
  { _id: "pt-pers", type: "projectType", name: "Personal", order: 2, isDefault: true },
];

export function useProjectOptions() {
  const [categories, setCategories] = useState<ProjectOptionItem[]>(DEFAULT_CATEGORIES);
  const [projectTypes, setProjectTypes] = useState<ProjectOptionItem[]>(DEFAULT_PROJECT_TYPES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const allOptions: ProjectOptionItem[] = json.data;
          const cats = allOptions.filter((o) => o.type === "category");
          const types = allOptions.filter((o) => o.type === "projectType");

          setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
          setProjectTypes(types.length > 0 ? types : DEFAULT_PROJECT_TYPES);
        }
      }
    } catch (err: any) {
      console.error("Error fetching project options:", err);
      setError(err?.message || "Failed to load project categories and types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    categories,
    projectTypes,
    loading,
    error,
    refresh: fetchOptions,
  };
}
