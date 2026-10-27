"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { CONFIG } from "../../common";
import ConfirmDialog from "./ConfirmDialog";
import { getCloudinaryDownloadUrl } from "../../lib/cloudinary";

interface RecentAsset {
  id: string;
  publicId: string;
  shortPath: string;
  url: string;
  originalName?: string;
  format?: string;
}

interface MediaUploaderProps {
  label: string;
  section: string; // e.g. "navbar", "hero", "resume"
  category: string; // e.g. "logo", "hero_image", "resume_pdf"
  accept: string; // e.g. "image/*" or "application/pdf"
  currentValue: string; // clean shortPath (e.g. "v1773030225/portfolio_app/logo_black") or URL
  onSelect: (value: string) => void;
  onFileUploaded?: (fileName: string, file: File) => void;
  helperText?: string;
  isPdf?: boolean;
  hideDropzone?: boolean;
  allowManualInput?: boolean;
}

/**
 * Reusable Media Uploader & Link Provider
 * 1. Supports File Upload via Cloudinary drag-and-drop.
 * 2. Supports Direct CDN / Drive Link input.
 * 3. Can hide dropzone (e.g. for PDF where user inputs Drive link directly).
 */
export default function MediaUploader({
  label,
  section,
  category,
  accept,
  currentValue,
  onSelect,
  onFileUploaded,
  helperText,
  isPdf = false,
  hideDropzone = false,
  allowManualInput = true,
}: MediaUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">(
    hideDropzone ? "manual" : "upload"
  );
  const [manualUrl, setManualUrl] = useState(currentValue || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setManualUrl(currentValue || "");
  }, [currentValue]);

  // Extract short display label (for UI label only – we still send full URL to backend)
  const extractShortPath = (val: string): string => {
    if (!val) return "";
    // Strip full URL down to everything after /upload/ for a clean readable label
    const uploadMatch = val.match(/\/upload\/(?:[a-zA-Z0-9_,]+\/)?(.*)$/);
    if (uploadMatch && uploadMatch[1]) {
      // Also strip the file extension so label reads clean (e.g. v1792417424/.../file_o2tqka)
      return uploadMatch[1].replace(/\.(png|jpg|jpeg|webp|svg|gif|avif)$/i, "");
    }
    return val.replace(/^\/+/, "").replace(/\.(png|jpg|jpeg|webp|svg|gif|avif)$/i, "");
  };

  // Convert stored full URL or short path to a displayable URL for <img> preview
  const getDisplayUrl = (val: string): string => {
    if (!val) return "";
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    // Short path fallback — expand to full URL
    const cleanPath = val.replace(/^\/+/, "");
    const resourceType = isPdf || cleanPath.toLowerCase().endsWith(".pdf") ? "raw" : "image";
    return `https://res.cloudinary.com/${CONFIG.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${cleanPath}`;
  };

  const cleanShortValue = extractShortPath(currentValue);
  const currentDisplayUrl = getDisplayUrl(currentValue);

  // Lazy fetch recent 3 assets when user interacts
  const fetchRecent = async () => {
    if (hasFetchedRecent) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/media?section=${section}&category=${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setRecentAssets(data.assets);
      }
    } catch {
      // Silently ignore
    } finally {
      setHasFetchedRecent(true);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    const token = localStorage.getItem("admin_token");
    if (!token) {
      setErrorMsg("Authentication session expired. Please log in again.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section", section);
    formData.append("category", category);

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      // Pass the full Cloudinary secureUrl so backend stores a ready-to-use URL.
      // Cloudinary's f_auto/q_auto will handle format (webp, avif, etc.) automatically.
      const secureUrl = data.asset.url || data.asset.secureUrl || data.asset.shortPath;
      onSelect(secureUrl);
      if (onFileUploaded) {
        onFileUploaded(file.name, file);
      }

      if (Array.isArray(data.recentAssets)) {
        setRecentAssets(data.recentAssets);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<RecentAsset | null>(null);

  const confirmDeleteAsset = async () => {
    if (!assetToDelete || !assetToDelete.id) return;

    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setDeletingId(assetToDelete.id);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/media/${assetToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recentAssets)) {
        setRecentAssets(data.recentAssets);
        // If deleted asset was currently selected, reset value
        const deletedUrl = assetToDelete.url || assetToDelete.shortPath;
        if (currentValue === deletedUrl) {
          onSelect("");
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMsg("Failed to delete asset from Cloudinary.");
    } finally {
      setDeletingId(null);
      setAssetToDelete(null);
    }
  };

  const handleDeleteClick = (asset: RecentAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssetToDelete(asset);
  };
  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="space-y-2.5 text-xs"
      onFocus={fetchRecent}
      onMouseEnter={fetchRecent}
    >
      <div className="flex items-center justify-between">
        <label className="form-label font-semibold text-zinc-900 !mb-0">{label}</label>
        {cleanShortValue && (
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]" title={cleanShortValue}>
            {cleanShortValue}
          </span>
        )}
      </div>

      {/* Mode Switcher Tabs if both upload and manual are enabled and dropzone isn't hidden */}
      {!hideDropzone && allowManualInput && (
        <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-lg w-fit border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              activeTab === "upload"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-slate-500 hover:text-zinc-800"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              activeTab === "manual"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-slate-500 hover:text-zinc-800"
            }`}
          >
            Direct CDN / Link
          </button>
        </div>
      )}

      {/* Manual CDN / Drive Link Input */}
      {(hideDropzone || activeTab === "manual") ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => {
                setManualUrl(e.target.value);
                onSelect(e.target.value);
              }}
              // placeholder commented out as requested
              // placeholder={isPdf ? "https://drive.google.com/uc?export=download&id=..." : "https://res.cloudinary.com/... or short path"}
              placeholder=""
              className="form-input bg-white text-xs py-2"
            />
            {currentValue && (
              <button
                type="button"
                onClick={() => {
                  setManualUrl("");
                  onSelect("");
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 border border-zinc-200 rounded-xl"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {isPdf
              ? "Paste a direct Google Drive link, Cloudinary URL, or PDF link."
              : "Paste an external image CDN URL or short path."}
          </p>
        </div>
      ) : (
        /* Modern Drag and Drop Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-4 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center ${
            isDragging
              ? "border-blue-500 bg-blue-50/80 scale-[1.01]"
              : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/60 hover:bg-zinc-50"
          } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUploadFile(e.target.files[0]);
            }}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-zinc-700">Uploading to Cloudinary...</span>
            </div>
          ) : (
            <>
              {/* Upload Cloud / Document Icon */}
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shadow-2xs">
                {isPdf ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  <span className="text-blue-600 underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isPdf ? "PDF Documents up to 10MB" : "PNG, JPG, WebP, SVG (Vector)"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium">
          {errorMsg}
        </div>
      )}

      {/* Clean Live Preview Box (No ugly URLs exposed) */}
      {currentDisplayUrl && (
        <div className="p-2.5 rounded-xl bg-white border border-zinc-200/90 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            ) : (
              <div className="h-9 w-14 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <Image
                  src={currentDisplayUrl}
                  alt="Asset Preview"
                  width={56}
                  height={32}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-zinc-900 block truncate">
                Active Selection
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {cleanShortValue}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isPdf && (
              <a
                href={currentDisplayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Preview</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}

            {isPdf && (
              <a
                href={getCloudinaryDownloadUrl(currentValue, "resume.pdf")}
                download="resume.pdf"
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Download PDF</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>
            )}

            <button
              type="button"
              onClick={() => onSelect("")}
              title="Remove active selection"
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:underline cursor-pointer pl-1.5 border-l border-zinc-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 3-Slot Cloudinary Gallery */}
      {recentAssets.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Recent Storage ({recentAssets.length}/3 max) — Click to select:
            </span>
            <span className="text-[10px] text-slate-400">Oldest auto-purged on 4th</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {recentAssets.map((asset, idx) => {
              // Use the full secureUrl for selection — Cloudinary handles format via f_auto
              const assetFullUrl = asset.url || asset.shortPath;
              const assetDisplayUrl = getDisplayUrl(assetFullUrl);
              const assetLabel = extractShortPath(assetFullUrl);
              const isSelected = currentValue === assetFullUrl;

              return (
                <div
                  key={asset.id || idx}
                  className={`relative group/slot p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500"
                      : "border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100/90"
                  }`}
                >
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(asset, e)}
                    disabled={deletingId === asset.id}
                    title="Delete permanently from Cloudinary"
                    className="absolute top-1 right-1 w-5 h-5 bg-rose-50 hover:bg-rose-600 text-rose-500 border border-rose-500 rounded-full  hover:text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-all z-10 cursor-pointer shadow-2xs"
                  >
                    {deletingId === asset.id ? (
                      <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelect(assetFullUrl)}
                    className="w-full flex flex-col items-center justify-center cursor-pointer"
                  >
                    {isPdf ? (
                      <div className="flex flex-col items-center gap-1 text-center py-1">
                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="text-[10px] font-semibold text-zinc-800 truncate max-w-[80px]">
                          {asset.originalName || `PDF #${idx + 1}`}
                        </span>
                      </div>
                    ) : (
                      <div className="h-10 w-full flex items-center justify-center overflow-hidden">
                        <Image
                          src={assetDisplayUrl}
                          alt="Recent upload"
                          width={60}
                          height={36}
                          className="max-h-full max-w-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}

                    <span className="text-[9px] text-slate-500 font-medium mt-1 w-full overflow-hidden">
                      {isSelected ? "Active" : assetLabel || `Slot ${idx + 1}`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modern UI Confirmation Modal (Replaces browser alert/confirm) */}
      <ConfirmDialog
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
        onConfirm={confirmDeleteAsset}
        title="Delete Media Asset?"
        description={`Are you sure you want to permanently delete this ${isPdf ? "PDF document" : "image"} from Cloudinary and database? This action cannot be undone.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}
