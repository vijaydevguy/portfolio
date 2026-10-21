import { CLOUDINARY_URLS } from "../assets";
import { CONFIG } from "../common";

/**
 * ==============================================================================
 * Centralized Hero & Navbar Fallback Data (Frontend)
 * ==============================================================================
 * If the database is empty, loading, or returns an error, these fallback values
 * ensure the Navbar and Hero Section render seamlessly with valid images.
 */

export interface ResumeItemFallback {
  label: string;
  url: string;
  isPrimary: boolean;
}

export interface HeroFallbackData {
  logoText: string;
  logoUrl: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  heroImageUrl: string;
  resumes: ResumeItemFallback[];
  ctaContactText: string;
  ctaContactHref: string;
  isVisible: boolean;
}

export const HERO_FALLBACK_DATA: HeroFallbackData = {
  logoText: "Vijay Kumar",
  logoUrl: CLOUDINARY_URLS.logo,
  titlePrefix: "Software",
  titleHighlight: "Developer",
  subtitle:
    "Crafting scalable, high-performance web applications and intuitive digital experiences.",
  heroImageUrl: CLOUDINARY_URLS.hero_img,
  resumes: [
    {
      label: "Download Resume",
      url: CONFIG.RESUME_DOWNLOAD_URL,
      isPrimary: true,
    },
  ],
  ctaContactText: "Get in Touch",
  ctaContactHref: "#contact",
  isVisible: true,
};
