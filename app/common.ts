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
  SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://portfolio-gray-two-lmd2px973r.vercel.app",
} as const;
