"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface ProjectItem {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  category: "Development" | "UI / UX Design";
  projectType: "Professional" | "Personal";
  shortDescription: string;
  technologies: string[];
  previewImages: string[];
  hasDetailPage: boolean;
  liveUrl?: string;
  githubUrl?: string;
  overview?: string;
  keyFeatures?: string[] | string;
  role?: string;
  order?: number;
  isVisible?: boolean;
  isFeaturedOnHome?: boolean;
}

export function useProjectsData(category: string = "All", options: { home?: boolean } = {}) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.home) {
        params.set("home", "true");
      } else if (category && category !== "All") {
        params.set("category", category);
      }

      const queryString = params.toString();
      const url = `${CONFIG.BACKEND_URL}/api/projects${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProjects(json.data);
        } else {
          setError(json.message || "Failed to load projects");
        }
      } else {
        setError(`Failed to fetch projects (status: ${res.status})`);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err?.message || "Network error loading projects");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
  };
}

export function useProjectDetail(slug: string) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/detail/${slug}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProject(json.data);
        } else {
          setError(json.message || "Project not found");
        }
      } else {
        setError(`Failed to fetch project details (status: ${res.status})`);
      }
    } catch (err: any) {
      console.error("Error fetching project detail:", err);
      setError(err?.message || "Network error loading project");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    project,
    loading,
    error,
    refresh: fetchDetail,
  };
}
