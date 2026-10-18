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
  // Cal.com Meeting Link & Namespace Configuration
  CAL_COM_LINK: process.env.NEXT_PUBLIC_CAL_COM_LINK || "vijay-kumar/30min",
  CAL_COM_NAMESPACE: "quick-chat",
  // Quick Contact Information
  PHONE_NUMBER: process.env.NEXT_PUBLIC_PHONE_NUMBER || "+919876543210",
  PHONE_DISPLAY: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+91 98765 43210",
  WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210",
  WHATSAPP_PREFILLED_MESSAGE:
    "Hi Vijay, I came across your portfolio and would like to discuss an opportunity with you!",
  // Backend API URL: automatically switches between localhost:5000 and Render
  BACKEND_URL:
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://portfolio-backend-6z04.onrender.com"
      : "http://localhost:5000"),
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
