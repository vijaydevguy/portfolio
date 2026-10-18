/**
 * Global Constants & Configuration
 * Keep all global configuration variables, keys, and base URLs here.
 */

export const CONFIG = {
  // Cloudinary Configuration
  CLOUDINARY_BASE_URL: "https://res.cloudinary.com",
  CLOUDINARY_CLOUD_NAME:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtgn3hnzh",

  // Site Information
  SITE_NAME: "Vijaya kumar | Software Developer",
  SITE_DESCRIPTION: "Software Developer Portfolio",
  // Resume Direct Download URL (Google Drive)
  RESUME_DOWNLOAD_URL:
    "https://drive.google.com/uc?export=download&id=1QfIBC0J_QRX4MRoycDwEdD3xBt2kKSpE",
  // Analytics
  GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_ID || "G-GY8ENHWSSB",
} as const;

export interface NavItem {
  name: string;
  href: string;
}

/**
 * Global Navigation Links
 * Add/manage all site navigation links in this centralized place.
 * Every page and menu will automatically reflect updates made here.
 */
export const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
];
