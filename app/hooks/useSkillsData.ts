"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface SkillItemData {
  _id?: string;
  name: string;
  category: string;
  imageUrl: string;
  order?: number;
  isVisible?: boolean;
  createdAt?: string;
}

export function useSkillsData() {
  const [skills, setSkills] = useState<SkillItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/skills`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSkills(json.data || []);
      } else {
        setError(json.message || "Failed to load skills");
      }
    } catch {
      setError("Network error loading skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return { skills, loading, error, refresh: fetchSkills };
}
