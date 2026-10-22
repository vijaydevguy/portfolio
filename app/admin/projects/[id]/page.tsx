"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONFIG } from "@/app/common";
import MultiImageUploader, { ImageItem } from "@/app/components/ui/MultiImageUploader";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import { ProjectItem } from "@/app/hooks/useProjectsData";
import { useProjectOptions } from "@/app/hooks/useProjectOptions";
import toast from "react-hot-toast";

const getInitialProjectState = (defaultCategory = "Development", defaultType = "Personal"): Partial<ProjectItem> => ({
  title: "",
  slug: "",
  category: defaultCategory,
  projectType: defaultType,
  shortDescription: "",
  technologies: [],
  previewImages: [],
  hasDetailPage: true,
  liveUrl: "",
  githubUrl: "",
  overview: "",
  keyFeatures: "",
  role: "",
  order: 0,
  isVisible: true,
  isFeaturedOnHome: false,
});

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProjectPage(props: EditProjectPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full space-y-6">
            <div className="h-10 bg-zinc-200 rounded-xl w-48 animate-pulse" />
            <div className="h-96 bg-white border border-zinc-200 rounded-2xl p-8 animate-pulse" />
          </div>
        </div>
      }
    >
      <EditProjectContent {...props} />
    </Suspense>
  );
}

function EditProjectContent({ params }: EditProjectPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const isNew = projectId === "new";

  const router = useRouter();
  const { categories, projectTypes } = useProjectOptions();

  const defaultCategory = categories[0]?.name || "Development";
  const defaultType = projectTypes[0]?.name || "Personal";

  const [formData, setFormData] = useState<Partial<ProjectItem>>(() =>
    getInitialProjectState(defaultCategory, defaultType)
  );
  // Image items state holding both existing URLs and local preview items
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string>("");

  const [techInput, setTechInput] = useState("");
  const [draggedTechIdx, setDraggedTechIdx] = useState<number | null>(null);
  const [dragOverTechIdx, setDragOverTechIdx] = useState<number | null>(null);

  // Cleanly reset or fetch project data whenever projectId or isNew changes
  useEffect(() => {
    setTechInput("");

    if (isNew) {
      // Form reset: immediately clear state to a fresh blank project
      setFormData(getInitialProjectState(defaultCategory, defaultType));
      setImageItems([]);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/admin/single/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const data = json.data;
          // Normalize keyFeatures to string for RichTextEditor if it was an array
          let normalizedFeatures = data.keyFeatures;
          if (Array.isArray(normalizedFeatures)) {
            normalizedFeatures = `<ul>${normalizedFeatures.map((f: string) => `<li>${f}</li>`).join("")}</ul>`;
          }
          setFormData({
            ...data,
            keyFeatures: normalizedFeatures || "",
          });

          // Initialize image items from existing preview images
          const initialImgs: ImageItem[] = (data.previewImages || []).map((url: string, idx: number) => ({
            id: `existing_${idx}_${url}`,
            url,
            isPending: false,
          }));
          setImageItems(initialImgs);
        } else {
          toast.error(json.message || "Project not found");
        }
      } catch {
        toast.error("Network error loading project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, isNew, defaultCategory, defaultType, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    if (!formData.title?.trim()) {
      toast.error("Project title is required");
      return;
    }

    setIsSaving(true);
    setSavingStatus("Preparing project...");

    try {
      // 1. Check for any pending local images that need Cloudinary upload
      const pendingFiles = imageItems.filter((item) => item.isPending && item.file);
      let finalPreviewImages: string[] = [];

      if (pendingFiles.length > 0) {
        setSavingStatus(`Uploading ${pendingFiles.length} image(s) to Cloudinary...`);

        const uploadFormData = new FormData();
        pendingFiles.forEach((item) => {
          if (item.file) uploadFormData.append("files", item.file);
        });
        uploadFormData.append("section", "projects");
        uploadFormData.append("category", formData.slug || "gallery");

        const uploadRes = await fetch(`${CONFIG.BACKEND_URL}/api/media/upload-bulk`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || "Failed to upload screenshots to Cloudinary");
        }

        // Map uploaded assets back in the exact order user arranged them
        const uploadedAssets: Array<{ url: string; originalName: string }> = uploadJson.assets || [];
        let uploadIdx = 0;

        finalPreviewImages = imageItems.map((item) => {
          if (item.isPending && item.file) {
            const uploaded = uploadedAssets[uploadIdx];
            uploadIdx++;
            return uploaded?.url || item.url;
          }
          return item.url;
        });
      } else {
        // No pending files; preserve current order of existing URLs
        finalPreviewImages = imageItems.map((item) => item.url);
      }

      setSavingStatus("Saving project details...");

      // 2. Prepare payload with updated previewImages
      const projectPayload = {
        ...formData,
        previewImages: finalPreviewImages,
      };

      const url = isNew
        ? `${CONFIG.BACKEND_URL}/api/projects`
        : `${CONFIG.BACKEND_URL}/api/projects/${projectId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save project");
      }

      toast.success(isNew ? "Project created successfully!" : "Project updated successfully!");

      if (isNew) {
        setFormData(getInitialProjectState(defaultCategory, defaultType));
        setImageItems([]);
        setTechInput("");
      }

      setTimeout(() => {
        router.push("/admin/edit?tab=projects");
      }, 800);
    } catch (err: any) {
      toast.error(err.message || "Error saving project");
    } finally {
      setIsSaving(false);
      setSavingStatus("");
    }
  };

  // Technologies Tag Handlers
  const addTech = () => {
    if (techInput.trim()) {
      const current = formData.technologies || [];
      if (!current.includes(techInput.trim())) {
        setFormData({ ...formData, technologies: [...current, techInput.trim()] });
      }
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setFormData({
      ...formData,
      technologies: (formData.technologies || []).filter((t) => t !== tech),
    });
  };

  const moveTech = (fromIndex: number, toIndex: number) => {
    const list = [...(formData.technologies || [])];
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setFormData({ ...formData, technologies: list });
  };

  const handleTechDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTechIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleTechDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTechIdx !== index) {
      setDragOverTechIdx(index);
    }
  };

  const handleTechDragLeave = () => {
    setDragOverTechIdx(null);
  };

  const handleTechDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTechIdx === null || draggedTechIdx === targetIndex) {
      setDraggedTechIdx(null);
      setDragOverTechIdx(null);
      return;
    }
    moveTech(draggedTechIdx, targetIndex);
    setDraggedTechIdx(null);
    setDragOverTechIdx(null);
  };

  const handleTechDragEnd = () => {
    setDraggedTechIdx(null);
    setDragOverTechIdx(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-6">
          <div className="h-10 bg-zinc-200 rounded-xl w-48 animate-pulse" />
          <div className="h-96 bg-white border border-zinc-200 rounded-2xl p-8 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    // Case 2: Full Width Container with optimal margins
    <div className="min-h-screen w-full bg-[#F8FAFC] py-6 sm:py-10 px-4 sm:px-6 lg:px-10">
      <div className="w-full space-y-6">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/edit?tab=projects"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              {/* Show path cleanly */}
              <div className="text-[11px] font-mono text-slate-400">
                /admin/projects/{isNew ? "new" : projectId}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 font-heading">
                {isNew ? "Create New Project" : `Edit "${formData.title || "Project"}"`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/edit?tab=projects"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 shadow-2xs transition-all"
            >
              Cancel
            </Link>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="btn-primary !rounded-xl !py-2 !px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isNew ? "Publish Project" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Full-width Comprehensive Form Card */}
        <form onSubmit={handleSave} className="space-y-8 bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-xs w-full">
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
                1. Project Information
              </h2>

              <div className="flex items-center gap-4">
                {/* Home Page Featured Switch */}
                <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                  <span className="text-amber-900 font-semibold text-xs">Featured on Home (Max 3):</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.isFeaturedOnHome}
                    onClick={() => setFormData((prev) => ({ ...prev, isFeaturedOnHome: !prev.isFeaturedOnHome }))}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      formData.isFeaturedOnHome ? "bg-amber-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        formData.isFeaturedOnHome ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Public Visibility Switch */}
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
                  <span className="text-zinc-700 font-semibold text-xs">Publicly Visible:</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.isVisible}
                    onClick={() => setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }))}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      formData.isVisible ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        formData.isVisible ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label font-semibold text-zinc-900">Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      title,
                      slug: isNew ? autoSlug : prev.slug,
                    }));
                  }}
                  placeholder="e.g. Multi-Tenant E-Commerce SaaS"
                  className="form-input bg-white"
                />
              </div>

              <div>
                <label className="form-label font-semibold text-zinc-900">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. multi-tenant-ecommerce-saas"
                  className="form-input bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="form-label font-semibold text-zinc-900">Category</label>
                <select
                  value={formData.category || (categories[0]?.name || "All")}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input bg-white cursor-pointer"
                >
                  <option value="All">All</option>
                  {categories
                    .filter((c) => c.name.toLowerCase() !== "all")
                    .map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  {/* Fallback if current project category is not in list yet */}
                  {formData.category &&
                    formData.category !== "All" &&
                    !categories.some((c) => c.name === formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                </select>
              </div>

              <div>
                <label className="form-label font-semibold text-zinc-900">Project Type</label>
                <select
                  value={formData.projectType || (projectTypes[0]?.name || "All")}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="form-input bg-white cursor-pointer"
                >
                  <option value="All">All</option>
                  {projectTypes
                    .filter((pt) => pt.name.toLowerCase() !== "all")
                    .map((pt) => (
                      <option key={pt._id || pt.name} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  {/* Fallback if current project type is not in list yet */}
                  {formData.projectType &&
                    formData.projectType !== "All" &&
                    !projectTypes.some((p) => p.name === formData.projectType) && (
                      <option value={formData.projectType}>{formData.projectType}</option>
                    )}
                </select>
              </div>

              <div>
                <label className="form-label font-semibold text-zinc-900">Role / Designation</label>
                <input
                  type="text"
                  value={formData.role || ""}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Full Stack SDE • Best Labz"
                  className="form-input bg-white"
                />
              </div>

              <div>
                <label className="form-label font-semibold text-zinc-900">Display Order</label>
                <input
                  type="number"
                  value={formData.order ?? 0}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="form-input bg-white"
                />
              </div>
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">Short Summary (Displayed on Cards) *</label>
              <textarea
                rows={2}
                required
                value={formData.shortDescription || ""}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Enterprise platform managing Master Admin and storefronts..."
                className="form-input bg-white resize-none"
              />
            </div>
          </div>

          {/* Section 2: Single Multi-Image Uploader (Client Preview + Deferred Cloudinary Upload on Save) */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <MultiImageUploader
              label="Project Showcase Screenshots (Max 10 Images)"
              items={imageItems}
              onChange={setImageItems}
              maxImages={10}
              helperText="Select multiple screenshots or paste direct URLs. Images preview instantly and only upload to Cloudinary when you save."
            />
          </div>

          {/* Section 3: Technologies Stack */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
                3. Technologies & Tools
              </h2>
              {(formData.technologies || []).length > 1 && (
                <span className="text-[11px] text-zinc-600 flex items-center gap-1 font-medium">
                  <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  Drag badges to rearrange
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
                placeholder="e.g. Next.js, TypeScript, PostgreSQL"
                className="form-input bg-white flex-1"
              />
              <button
                type="button"
                onClick={addTech}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold cursor-pointer shadow-xs whitespace-nowrap"
              >
                Add Tech
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(formData.technologies || []).map((t, index) => {
                const isDragging = draggedTechIdx === index;
                const isOver = dragOverTechIdx === index;
                return (
                  <div
                    key={`${t}-${index}`}
                    draggable
                    onDragStart={(e) => handleTechDragStart(e, index)}
                    onDragOver={(e) => handleTechDragOver(e, index)}
                    onDragLeave={handleTechDragLeave}
                    onDrop={(e) => handleTechDrop(e, index)}
                    onDragEnd={handleTechDragEnd}
                    className={`group inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border text-xs font-medium cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                      isDragging
                        ? "opacity-40 border-dashed border-blue-400 bg-blue-50 scale-95"
                        : isOver
                        ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/30 -translate-y-0.5"
                        : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800 shadow-2xs"
                    }`}
                    title="Drag to rearrange order"
                  >
                    {/* Grip handle indicator */}
                    <span className="text-zinc-600 group-hover:text-zinc-600 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                    </span>

                    <span>{t}</span>

                    {/* Prominent Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTech(t);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-md text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove technology"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: External Deployment Links */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
              4. External Deployment & Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label font-semibold text-zinc-900">Live Demo URL</label>
                <input
                  type="url"
                  value={formData.liveUrl || ""}
                  onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="form-input bg-white"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-zinc-900">GitHub Repository URL</label>
                <input
                  type="url"
                  value={formData.githubUrl || ""}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="form-input bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Dedicated Case Study Page */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
                5. Dedicated Case Study Page (/projects/{formData.slug || "slug"})
              </h2>

              {/* Case Study Toggle Switch */}
              <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-200/80 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                <span className="text-blue-950 font-semibold text-xs">Enable Case Study:</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.hasDetailPage ?? true}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      hasDetailPage: !(prev.hasDetailPage ?? true),
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    (formData.hasDetailPage ?? true) ? "bg-blue-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      (formData.hasDetailPage ?? true) ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {(formData.hasDetailPage ?? true) && (
              <div className="space-y-6 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                {/* Extended Overview with RichTextEditor */}
                <div>
                  <RichTextEditor
                    label="Extended Overview (Case Study Story)"
                    value={typeof formData.overview === "string" ? formData.overview : ""}
                    onChange={(html) => setFormData({ ...formData, overview: html })}
                    placeholder="Comprehensive explanation of architectural design, scale, problem statement, and solution..."
                    helperText="Format with headings, bold points, paragraphs, or story blocks."
                  />
                </div>

                {/* Rich Text Editor for Key Features / Highlights */}
                <div>
                  <RichTextEditor
                    label="Key Features & Architecture Highlights (Rich Text Editor)"
                    value={typeof formData.keyFeatures === "string" ? formData.keyFeatures : ""}
                    onChange={(html) => setFormData({ ...formData, keyFeatures: html })}
                    placeholder="Enter bold points, bullets, description, or custom feature notes as you wish..."
                    helperText="Format with bullets, bold text, headings, or numbered items freely."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Case 7: Bottom Save & Cancel Bar */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200">
            <Link
              href="/admin/edit?tab=projects"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary !rounded-xl !py-2.5 !px-7 font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isSaving ? savingStatus || "Saving..." : isNew ? "Create & Publish Project" : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
