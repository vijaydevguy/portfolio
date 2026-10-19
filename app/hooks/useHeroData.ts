"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface ResumeItem {
  _id?: string;
  label: string;
  url: string;
  isPrimary?: boolean;
}

export interface HeroSectionData {
  _id?: string;
  logoText?: string;
  logoUrl?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  subtitle?: string;
  heroImageUrl?: string;
  resumes?: ResumeItem[];
  ctaContactText?: string;
  ctaContactHref?: string;
  isVisible?: boolean;
}

export function useHeroData() {
  const [data, setData] = useState<HeroSectionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHeroData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/sections/hero`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || "Failed to fetch hero data");
        }
      } else {
        setError(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Error fetching hero data:", err);
      setError(err?.message || "Network error fetching hero data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  return {
    data,
    loading,
    error,
    refresh: fetchHeroData,
  };
}
