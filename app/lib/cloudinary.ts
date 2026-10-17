/**
 * Cloudinary Image Helper Utility
 *
 * Benefits:
 * 1. Security & Abstraction: Keeps your base cloud URL and transformations centralized.
 * 2. Flexibility: Accepts short paths (e.g. `v1792239302/logo_white_4x_gns8yk`) or full URLs.
 * 3. Automatic Format & Quality: Applies `f_auto,q_auto` (WebP/AVIF and optimal compression).
 * 4. Dynamic Transformations: Easily pass custom width, height, crop mode, or quality.
 */
import { CONFIG } from "../common";

const CLOUDINARY_BASE_URL = CONFIG.CLOUDINARY_BASE_URL;
const CLOUD_NAME = CONFIG.CLOUDINARY_CLOUD_NAME;

export interface CloudinaryOptions {
  width?: number | "auto";
  height?: number | "auto";
  quality?: "auto" | number | string;
  format?: "auto" | "png" | "jpg" | "webp" | "svg";
  crop?: "fill" | "fit" | "scale" | "limit" | "thumb";
  extraTransformations?: string;
}

/**
 * Generates an optimized Cloudinary URL.
 *
 * @example
 * getCloudinaryUrl("v1792239302/logo_white_4x_gns8yk")
 * // => "https://res.cloudinary.com/dtgn3hnzh/image/upload/f_auto,q_auto/v1792239302/logo_white_4x_gns8yk"
 *
 * @example
 * getCloudinaryUrl("v1792239302/logo_white_4x_gns8yk", { width: 500, quality: "auto" })
 * // => "https://res.cloudinary.com/dtgn3hnzh/image/upload/w_500,q_auto,f_auto/v1792239302/logo_white_4x_gns8yk"
 */

export function getCloudinaryUrl(
  pathOrUrl: string,
  options: CloudinaryOptions = {},
): string {
  if (!pathOrUrl) return "";

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop,
    extraTransformations,
  } = options;

  // Build transformation query string
  const transformations: string[] = [];

  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (extraTransformations) transformations.push(extraTransformations);

  const transformString = transformations.join(",");

  // Case 1: Already a full Cloudinary URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    if (pathOrUrl.includes("res.cloudinary.com") && transformString) {
      // If no transformations yet in URL, inject before /v[0-9]+/ or upload/
      if (pathOrUrl.includes("/image/upload/")) {
        const parts = pathOrUrl.split("/image/upload/");
        const afterUpload = parts[1];

        // Check if already transformed
        if (afterUpload.startsWith("v") || afterUpload.includes("/")) {
          return `${parts[0]}/image/upload/${transformString}/${afterUpload}`;
        }
      }
    }
    return pathOrUrl;
  }

  // Case 2: Clean up short relative path (e.g. "v1792239302/logo_white_4x_gns8yk" or "/v1792...")
  const cleanPath = pathOrUrl.replace(/^\/+/, "");

  return `${CLOUDINARY_BASE_URL}/${CLOUD_NAME}/image/upload/${transformString}/${cleanPath}`;
}
