"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONFIG } from "@/app/common";
import MultiImageUploader, { ImageItem } from "@/app/components/ui/MultiImageUploader";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import { ProjectItem } from "@/app/hooks/useProjectsData";
import { useProjectOptions } from "@/app/hooks/useProjectOptions";
import { triggerSessionExpired } from "@/app/context/AuthContext";
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
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string>("");
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const [techInput, setTechInput] = useState("");
  const [draggedTechIdx, setDraggedTechIdx] = useState<number | null>(null);
  const [dragOverTechIdx, setDragOverTechIdx] = useState<number | null>(null);

  // Storage key: separate draft keys for new projects vs specific editing project
  const storageKey = isNew ? "project_form_draft_new" : `project_form_draft_${projectId}`;

  // Once mounted on client, verify draft restoration for new project or fetch from server for existing
  useEffect(() => {
    setIsClient(true);
    setTechInput("");

    if (isNew) {
      // Check if a saved draft exists in localStorage for new project
      try {
        const savedDraft = localStorage.getItem("project_form_draft_new");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === "object") {
            setFormData(parsed);
            if (Array.isArray(parsed.savedImageUrls) && parsed.savedImageUrls.length > 0) {
              setImageItems(
                parsed.savedImageUrls.map((url: string, idx: number) => ({
                  id: `draft_img_${idx}_${url}`,
                  url,
                  isPending: false,
                }))
              );
            }
            setIsDraftSaved(true);
          }
        }
      } catch (err) {
        console.warn("Could not load draft from localStorage:", err);
      }
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
        // Check if an unsaved edit draft exists
        const editDraftKey = `project_form_draft_${projectId}`;
        let restoredFromDraft = false;
        try {
          const savedDraft = localStorage.getItem(editDraftKey);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && typeof parsed === "object") {
              setFormData((prev) => ({
                ...prev,
                ...parsed,
              }));
              if (Array.isArray(parsed.savedImageUrls) && parsed.savedImageUrls.length > 0) {
                setImageItems(
                  parsed.savedImageUrls.map((url: string, idx: number) => ({
                    id: `draft_img_${idx}_${url}`,
                    url,
                    isPending: false,
                  }))
                );
              }
              restoredFromDraft = true;
            }
          }
        } catch (e) {
          console.warn("Could not load edit draft:", e);
        }

        const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/admin/single/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          triggerSessionExpired();
          return;
        }

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const data = json.data;
          // If we haven't restored from an unsaved draft, load the latest server state
          if (!restoredFromDraft) {
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
          }
        } else if (!restoredFromDraft) {
          toast.error(json.message || "Project not found");
        }
      } catch {
        toast.error("Network error loading project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isNew, router]);

  // Auto-persist formData and existing image URLs to localStorage whenever modified
  useEffect(() => {
    if (loading) return;

    try {
      // Check if user has entered anything meaningful
      const hasContent = Boolean(
        formData.title?.trim() ||
        formData.shortDescription?.trim() ||
        formData.overview?.trim() ||
        formData.liveUrl?.trim() ||
        formData.githubUrl?.trim() ||
        (Array.isArray(formData.technologies) && formData.technologies.length > 0) ||
        (typeof formData.keyFeatures === "string" && formData.keyFeatures.trim())
      );

      // Only save if there is actually content entered
      if (hasContent) {
        const savedImageUrls = imageItems
          .filter((item) => item.url && !item.url.startsWith("blob:"))
          .map((item) => item.url as string);

        const draftPayload = {
          ...formData,
          savedImageUrls,
        };

        localStorage.setItem(storageKey, JSON.stringify(draftPayload));
      }
    } catch (err) {
      console.warn("Could not persist form draft:", err);
    }
  }, [formData, imageItems, storageKey, loading]);

  // Helper to discard the local draft and reset
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setIsDraftSaved(false);
    if (isNew) {
      setFormData(getInitialProjectState(defaultCategory, defaultType));
      setImageItems([]);
      toast.success("Form cleared");
    } else {
      window.location.reload();
    }
  };

  /**
   * Save handler supporting:
   * 1. saveAsDraft: true -> calls API with isVisible: false (stored in DB without publishing)
   * 2. saveAsDraft: false -> publishes or saves changes
   */
  const handleSave = async (options?: { isDraft?: boolean }) => {
    const isDraft = Boolean(options?.isDraft);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      triggerSessionExpired();
      return;
    }

    if (!formData.title?.trim()) {
      toast.error("Project title is required to save");
      return;
    }

    setIsSaving(true);
    setSavingStatus(isDraft ? "Saving project as unpublished draft..." : "Saving & publishing project...");

    try {
      // 1. Construct single FormData payload for project details and any pending local images
      const uploadFormData = new FormData();

      // Append standard text/scalar fields
      uploadFormData.append("title", formData.title || "");
      uploadFormData.append("slug", formData.slug || "");
      uploadFormData.append("category", formData.category || defaultCategory);
      uploadFormData.append("projectType", formData.projectType || defaultType);
      uploadFormData.append("role", formData.role || "");
      uploadFormData.append("order", String(formData.order ?? 0));
      uploadFormData.append("shortDescription", formData.shortDescription || "");
      uploadFormData.append("liveUrl", formData.liveUrl || "");
      uploadFormData.append("githubUrl", formData.githubUrl || "");
      uploadFormData.append("overview", formData.overview || "");
      uploadFormData.append("keyFeatures", typeof formData.keyFeatures === "string" ? formData.keyFeatures : JSON.stringify(formData.keyFeatures || []));
      uploadFormData.append("hasDetailPage", String(formData.hasDetailPage ?? true));

      // Key difference: when saving as draft, set isVisible=false and isFeaturedOnHome=false
      uploadFormData.append("isVisible", String(isDraft ? false : (formData.isVisible ?? true)));
      uploadFormData.append("isFeaturedOnHome", String(isDraft ? false : (formData.isFeaturedOnHome ?? false)));

      if (Array.isArray(formData.technologies)) {
        uploadFormData.append("technologies", JSON.stringify(formData.technologies));
      }

      // Reconstruct image order tokens and append any pending files
      const imageOrderTokens: string[] = [];
      const existingUrls: string[] = [];
      let pendingFileIdx = 0;

      imageItems.forEach((item) => {
        if (item.isPending && item.file) {
          uploadFormData.append("files", item.file);
          imageOrderTokens.push(`file:${pendingFileIdx}`);
          pendingFileIdx++;
        } else if (item.url && !item.url.startsWith("blob:")) {
          imageOrderTokens.push(item.url);
          existingUrls.push(item.url);
        }
      });

      uploadFormData.append("imageOrder", JSON.stringify(imageOrderTokens));
      uploadFormData.append("previewImages", JSON.stringify(existingUrls));

      const url = isNew
        ? `${CONFIG.BACKEND_URL}/api/projects`
        : `${CONFIG.BACKEND_URL}/api/projects/${projectId}`;
      const method = isNew ? "POST" : "PUT";

      // 2. Single API Call: uploads files concurrently and saves to MongoDB
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (res.status === 401 || res.status === 403) {
        triggerSessionExpired();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save project");
      }

      // 3. Inspect if any individual image uploads failed
      const failedUploads: Array<{ originalName: string; reason: string }> = json.failedUploads || [];
      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map((f) => `• ${f.originalName}: ${f.reason}`).join("\n");
        toast.error(
          `Project saved in database, but ${failedUploads.length} image(s) failed to upload:\n${failedNames}`,
          { duration: 7000 }
        );
      } else {
        toast.success(
          isDraft
            ? "Project saved as draft in database (unpublished)!"
            : isNew
            ? "Project created and published successfully!"
            : "Project updated successfully!"
        );
      }

      // Clear saved draft from localStorage on success
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      setIsDraftSaved(true);

      if (isNew && !isDraft) {
        setFormData(getInitialProjectState(defaultCategory, defaultType));
        setImageItems([]);
        setTechInput("");
      }

      setTimeout(() => {
        router.push("/admin/edit?tab=projects");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Error saving project");
    } finally {
      setIsSaving(false);
      setSavingStatus("");
    }
  };

  const handleSaveAsDraft = () => {
    handleSave({ isDraft: true });
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
            {isNew ? (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                title="Clear all fields and wipe saved draft"
              >
                Clear Form
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                title="Discard unsaved local changes and reload from server"
              >
                Clear Draft
              </button>
            )}

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Save changes locally in browser"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{isDraftSaved ? "Draft Saved ✓" : "Save as Draft"}</span>
            </button>

            <Link
              href="/admin/edit?tab=projects"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 shadow-2xs transition-all"
            >
              Cancel
            </Link>

            {/* Publish / Save Button: disabled until title is entered */}
            <button
              onClick={() => handleSave()}
              disabled={isSaving || !formData.title?.trim()}
              className="btn-primary !rounded-xl !py-2 !px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={!formData.title?.trim() ? "Enter a project title to enable publish" : ""}
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isNew ? "Publish Project" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Full-width Comprehensive Form Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave({ isDraft: false });
          }}
          className="space-y-8 bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-xs w-full"
        >
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
              <h2
                suppressHydrationWarning
                className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading"
              >
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
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{isDraftSaved ? "Draft Saved ✓" : "Save as Draft"}</span>
            </button>
            <Link
              href="/admin/edit?tab=projects"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving || !formData.title?.trim()}
              className="btn-primary !rounded-xl !py-2.5 !px-7 font-semibold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title={!formData.title?.trim() ? "Enter a project title to enable publish" : ""}
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
