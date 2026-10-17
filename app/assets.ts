/**
 * Centralized Cloudinary Asset Registry
 * All media is hosted on Cloudinary - no physical local image storage.
 * Replace or add your Cloudinary URLs here to manage them in one place.
 */

export const CLOUDINARY_URLS = {
  // Brand & Profile
  logo_black:
    "https://res.cloudinary.com/dtgn3hnzh/image/upload/v1792239298/logo_white_4x-1_caa6ld.png",
  logo: "https://res.cloudinary.com/dtgn3hnzh/image/upload/v1792239302/logo_white_4x_gns8yk.png",
  avatar: "https://res.cloudinary.com/demo/image/upload/sample.jpg",

  // Projects Showcase
  projects: {
    project1: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    project2: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  },

  // Certificates / Media
  certificates: {},

  // Social / Tech Stack Icons (Optional if not using SVG icons directly)
  icons: {},
} as const;

export type CloudinaryKey = keyof typeof CLOUDINARY_URLS;
