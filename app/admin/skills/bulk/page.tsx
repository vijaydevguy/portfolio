"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONFIG } from "@/app/common";
import { SKILL_CATEGORIES } from "@/app/constants/skillCategories";
import toast from "react-hot-toast";

interface StagedSkillFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  category: string;
  otherCategory?: string;
  isPublished: boolean;
}

export default function SkillsUploadPage() {
  const router = useRouter();
  const [stagedFiles, setStagedFiles] = useState<StagedSkillFile[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("Frontend");
  const [defaultOtherCategory, setDefaultOtherCategory] = useState("");
  const [defaultPublished, setDefaultPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
    }
  }, [router]);

  // Clean formatted name from original file name
  const cleanNameFromFileName = (fileName: string): string => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const cleaned = nameWithoutExt.replace(/[-_]+/g, " ").trim();
    return cleaned
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const addFilesToStage = (files: File[]) => {
    const newItems: StagedSkillFile[] = files.map((file, idx) => ({
      id: `${file.name}-${Date.now()}-${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: cleanNameFromFileName(file.name),
      category: defaultCategory,
      otherCategory: defaultOtherCategory,
      isPublished: defaultPublished,
    }));

    setStagedFiles((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} image${newItems.length > 1 ? "s" : ""} to queue`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToStage(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const incoming = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (incoming.length === 0) {
        toast.error("Please drop image files only (SVG, PNG, WebP, JPG)");
        return;
      }
      addFilesToStage(incoming);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<StagedSkillFile>) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setStagedFiles((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleApplyCategoryToAll = () => {
    const finalCat = defaultCategory;
    const finalOther = defaultOtherCategory;
    setStagedFiles((prev) =>
      prev.map((item) => ({
        ...item,
        category: finalCat,
        otherCategory: finalOther,
      }))
    );
    toast.success(
      `Applied "${finalCat === "Other" && finalOther ? finalOther : finalCat}" to all items`
    );
  };

  const handleApplyPublishToAll = (published: boolean) => {
    setStagedFiles((prev) =>
      prev.map((item) => ({ ...item, isPublished: published }))
    );
    toast.success(`Set all items to ${published ? "Published" : "Draft"}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    if (stagedFiles.length === 0) {
      toast.error("Please select or drop at least one image");
      return;
    }

    // Validate that every item has a title and a valid category
    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      if (!item.name.trim()) {
        toast.error(`Please provide a title for item #${i + 1}`);
        return;
      }
      if (item.category === "Other" && (!item.otherCategory || !item.otherCategory.trim())) {
        toast.error(`Please enter a custom category name for "${item.name}"`);
        return;
      }
    }

    setIsUploading(true);
    const toastId = toast.loading(
      `Uploading ${stagedFiles.length} image${stagedFiles.length > 1 ? "s" : ""}...`
    );

    try {
      // 1. Upload files concurrently to backend
      const formData = new FormData();
      stagedFiles.forEach((item) => {
        formData.append("files", item.file);
      });
      formData.append("section", "skills");
      formData.append("category", "icons");

      const uploadRes = await fetch(`${CONFIG.BACKEND_URL}/api/media/upload-bulk`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success || !Array.isArray(uploadJson.assets)) {
        throw new Error(uploadJson.message || "Failed to upload images");
      }

      toast.loading("Saving skills and configurations to database...", { id: toastId });

      // Match returned uploaded assets to staged files to retain user-configured titles, categories, and publish status
      const skillsToCreate = uploadJson.assets.map((asset: any, index: number) => {
        const matchingStaged = stagedFiles[index];
        const finalCategory =
          matchingStaged?.category === "Other" && matchingStaged.otherCategory?.trim()
            ? matchingStaged.otherCategory.trim()
            : matchingStaged?.category || defaultCategory;

        return {
          name: (matchingStaged?.name || cleanNameFromFileName(asset.originalName || "Skill")).trim(),
          imageUrl: asset.url,
          category: finalCategory,
          isVisible: matchingStaged ? matchingStaged.isPublished : true,
        };
      });

      // 2. Batch insert into database
      const createRes = await fetch(`${CONFIG.BACKEND_URL}/api/skills/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: skillsToCreate }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) {
        throw new Error(createJson.message || "Failed to save skills in database");
      }

      toast.success(
        `Successfully saved ${createJson.count} skill${createJson.count > 1 ? "s" : ""}!`,
        { id: toastId }
      );

      // Clean up object URLs
      stagedFiles.forEach((x) => URL.revokeObjectURL(x.previewUrl));

      setTimeout(() => {
        router.push("/admin/edit?tab=skills");
      }, 600);
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/admin/edit?tab=skills" className="hover:text-zinc-950 font-medium">
                Admin
              </Link>
              <span>/</span>
              <Link href="/admin/edit?tab=skills" className="hover:text-zinc-950 font-medium">
                Skills & Technologies
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-semibold">Upload</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-950 font-heading">
              Upload Skills & Technologies
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload a single logo or multiple logos at once. Titles are auto-populated from file names, categories are customizable with custom entry support, and each item has a publish toggle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/edit?tab=skills"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all"
            >
              Back to Skills Table
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || stagedFiles.length === 0}
              className="btn-primary !text-xs !py-2.5 !px-5 font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving {stagedFiles.length} Skills...</span>
                </>
              ) : (
                <span>Save All ({stagedFiles.length}) Skills</span>
              )}
            </button>
          </div>
        </div>

        {/* Global Configuration & Dropzone Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Default Batch Settings
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Newly selected files will automatically adopt these defaults. You can also customize each row below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Category:</span>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="form-input bg-white text-xs py-2 w-44"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>

                {defaultCategory === "Other" && (
                  <input
                    type="text"
                    value={defaultOtherCategory}
                    onChange={(e) => setDefaultOtherCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    className="form-input bg-white text-xs py-2 w-44"
                  />
                )}

                {stagedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyCategoryToAll}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap cursor-pointer"
                    title="Apply selected category to all items currently in list"
                  >
                    Apply Category to All
                  </button>
                )}
              </div>

              {/* Publish Toggle Default */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !defaultPublished;
                    setDefaultPublished(next);
                    if (stagedFiles.length > 0) handleApplyPublishToAll(next);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    defaultPublished
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      defaultPublished ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  <span>{defaultPublished ? "Publish by Default" : "Draft by Default"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Dropzone (Single or Multiple) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
              isDragActive
                ? "border-blue-500 bg-blue-50/80 scale-[1.005]"
                : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              id="skillUploadPageInput"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="skillUploadPageInput" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shadow-xs">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-zinc-900 text-sm">
                  <span className="text-blue-600 underline">Click to choose image(s)</span> or drag & drop here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Upload 1 logo or 20+ logos at once • SVG, PNG, WebP, JPG
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Staged Items Review Table */}
        {stagedFiles.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden space-y-0">
            <div className="flex items-center justify-between p-4 bg-zinc-50 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-heading">
                  Queued Skills ({stagedFiles.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  (Titles auto-populated from file name • edit freely)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stagedFiles.forEach((x) => URL.revokeObjectURL(x.previewUrl));
                  setStagedFiles([]);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/70 border-b border-zinc-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-16">Preview</th>
                    <th className="py-3 px-4">Skill Title / Toast Name (Editable)</th>
                    <th className="py-3 px-4 w-56">Category</th>
                    <th className="py-3 px-4 w-32 text-center">Publish Toggle</th>
                    <th className="py-3 px-4 w-28 text-slate-400 font-mono">Original File</th>
                    <th className="py-3 px-4 w-16 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stagedFiles.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Icon preview */}
                      <td className="py-3 px-4">
                        <div className="relative w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 p-1 flex items-center justify-center overflow-hidden">
                          <Image
                            src={item.previewUrl}
                            alt={item.name}
                            width={36}
                            height={36}
                            className="object-contain max-h-full max-w-full"
                            unoptimized
                          />
                        </div>
                      </td>

                      {/* In-place Editable Title */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          placeholder="e.g. React.js, TailwindCSS..."
                          className="form-input bg-white text-xs py-2 w-full font-semibold text-zinc-900 border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        />
                      </td>

                      {/* Category Selector + Other input */}
                      <td className="py-3 px-4 space-y-1">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                          className="form-input bg-white text-xs py-1.5 w-full border-zinc-200"
                        >
                          {SKILL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="Other">Other (Custom)</option>
                        </select>
                        {item.category === "Other" && (
                          <input
                            type="text"
                            value={item.otherCategory || ""}
                            onChange={(e) => handleUpdateItem(item.id, { otherCategory: e.target.value })}
                            placeholder="Type custom category name..."
                            className="form-input bg-white text-xs py-1.5 w-full border-blue-300 focus:border-blue-500"
                          />
                        )}
                      </td>

                      {/* Publish / Draft Toggle Button */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.isPublished}
                            onClick={() => handleUpdateItem(item.id, { isPublished: !item.isPublished })}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                              item.isPublished ? "bg-emerald-500" : "bg-zinc-300"
                            }`}
                            title="Click to toggle publish status"
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                item.isPublished ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          {/* <span
                            className={`text-[11px] font-semibold select-none ${
                              item.isPublished ? "text-emerald-700" : "text-zinc-400"
                            }`}
                          >
                            {item.isPublished ? "Published" : "Unpublished"}
                          </span> */}
                        </div>
                      </td>

                      {/* Original File Name */}
                      <td
                        className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[120px]"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </td>

                      {/* Delete / Remove row */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-7 h-7 rounded-full border border-red-200 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs ml-auto"
                          title="Remove item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 border-t border-zinc-200">
              <span className="text-xs text-slate-500 font-medium">
                {stagedFiles.length} skill{stagedFiles.length > 1 ? "s" : ""} ready to save
              </span>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/edit?tab=skills"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="btn-primary !text-xs !py-2.5 !px-6 font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Skills...</span>
                    </>
                  ) : (
                    <span>Save All Skills</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
