"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface ExperienceItemData {
  _id?: string;
  role: string;
  company: string;
  type: string;
  period?: string;
  duration?: string;
  location?: string;
  description: string | string[];
  order?: number;
  isVisible?: boolean;
  createdAt?: string;
}

export interface EducationData {
  _id?: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  graduated: string;
  score: string;
  isVisible?: boolean;
}

export function useExperienceData() {
  const [experiences, setExperiences] = useState<ExperienceItemData[]>([]);
  const [education, setEducation] = useState<EducationData | null>(null);
  const [educations, setEducations] = useState<EducationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/experiences`);
      const json = await res.json();
      if (res.ok && json.success) {
        setExperiences(json.experiences || []);
        setEducation(json.education || null);
        setEducations(json.educations || (json.education ? [json.education] : []));
      } else {
        setError(json.message || "Failed to load experience data");
      }
    } catch {
      setError("Network error loading experience data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { experiences, education, educations, loading, error, refresh: fetchData };
}
