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

  const isPdf = pathOrUrl.toLowerCase().endsWith(".pdf") || pathOrUrl.includes(".pdf");
  const resourceType = pathOrUrl.includes("/raw/upload/") ? "raw" : "image";

  // Case 1: Already a full Cloudinary URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    if (pathOrUrl.includes("res.cloudinary.com") && transformString && !isPdf) {
      if (pathOrUrl.includes("/image/upload/")) {
        const parts = pathOrUrl.split("/image/upload/");
        const afterUpload = parts[1];

        if (afterUpload.startsWith("v") || afterUpload.includes("/")) {
          return `${parts[0]}/image/upload/${transformString}/${afterUpload}`;
        }
      }
    }
    return pathOrUrl;
  }

  // Case 2: Clean up short relative path (e.g. "v1792239302/logo_white_4x_gns8yk" or "/v1792...")
  const cleanPath = pathOrUrl.replace(/^\/+/, "");

  // For PDFs, do not apply image format/quality transformations like f_auto,q_auto
  if (isPdf) {
    return `${CLOUDINARY_BASE_URL}/${CLOUD_NAME}/${resourceType}/upload/${cleanPath}`;
  }

  return transformString
    ? `${CLOUDINARY_BASE_URL}/${CLOUD_NAME}/image/upload/${transformString}/${cleanPath}`
    : `${CLOUDINARY_BASE_URL}/${CLOUD_NAME}/image/upload/${cleanPath}`;
}

/**
 * Generates a direct forced-download Cloudinary URL with fl_attachment and proper filename
 * ensuring the user's browser downloads a genuine .pdf file rather than raw stream or wrong extension.
 */
export function getCloudinaryDownloadUrl(pathOrUrl: string, customFilename?: string): string {
  if (!pathOrUrl) return "";

  // If already an external link (Google Drive, Dropbox, custom host, etc.), return as is
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://")
  ) {
    if (!pathOrUrl.includes("res.cloudinary.com")) {
      return normalizeResumeUrl(pathOrUrl);
    }
  }

  const cleanPath = pathOrUrl.replace(/^https?:\/\/[^/]+\/[^/]+\/(?:image|raw)\/upload\//, "").replace(/^\/+/, "");
  const isPdf = pathOrUrl.toLowerCase().endsWith(".pdf") || pathOrUrl.includes(".pdf");
  const resourceType = pathOrUrl.includes("/raw/upload/") ? "raw" : "image";
  const filename = customFilename || (cleanPath.split("/").pop() || "document.pdf");
  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  // fl_attachment:filename forces attachment header with correct filename and .pdf extension
  const attachmentFlag = `fl_attachment:${encodeURIComponent(cleanFilename.replace(/\.pdf$/, ""))}`;

  return `${CONFIG.CLOUDINARY_BASE_URL}/${CONFIG.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${attachmentFlag}/${cleanPath}`;
}

/**
 * Normalizes resume URLs:
 * Converts various Google Drive link formats (e.g. drive.google.com/file/d/ID/view, open?id=ID, etc.)
 * into a direct downloadable link or clean preview link.
 */
export function normalizeResumeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // Handle Google Drive links
  if (trimmed.includes("drive.google.com")) {
    // Extract file ID from:
    // 1. /file/d/FILE_ID/...
    // 2. id=FILE_ID
    // 3. /d/FILE_ID
    const match =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      const fileId = match[1];
      // Return direct export download URL which triggers file download across all browsers
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  return trimmed;
}
