import { getCloudinaryUrl } from "./lib/cloudinary";

/**
 * Centralized Cloudinary Asset Registry
 *
 * All media is generated through `getCloudinaryUrl`.
 * You can pass:
 * 1. Just the short asset ID (e.g., "v1792239302/logo_white_4x_gns8yk")
 * 2. Or a full URL - both will work seamlessly with automatic optimizations (f_auto, q_auto)!
 */

export const CLOUDINARY_URLS = {
  // Brand & Profile
  logo_black: getCloudinaryUrl("v1792239298/logo_white_4x-1_caa6ld"),
  logo: getCloudinaryUrl("v1792239302/logo_white_4x_gns8yk"),
} as const;

export type CloudinaryKey = keyof typeof CLOUDINARY_URLS;
