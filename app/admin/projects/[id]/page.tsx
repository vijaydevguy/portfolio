"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONFIG } from "@/app/common";
import MultiImageUploader from "@/app/components/ui/MultiImageUploader";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import { ProjectItem } from "@/app/hooks/useProjectsData";
import { useProjectOptions } from "@/app/hooks/useProjectOptions";
import toast from "react-hot-toast";

const INITIAL_PROJECT_STATE: Partial<ProjectItem> = {
  title: "",
  slug: "",
  category: "Development",
  projectType: "Personal",
  shortDescription: "",
  technologies: ["React.js", "Node.js"],
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
};

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

  const [formData, setFormData] = useState<Partial<ProjectItem>>(INITIAL_PROJECT_STATE);
  const [loading, setLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const [techInput, setTechInput] = useState("");

  // Fetch project data if editing
  useEffect(() => {
    if (isNew) return;

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
  }, [projectId, isNew, router]);

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

    try {
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
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save project");
      }

      toast.success(isNew ? "Project created successfully!" : "Project updated successfully!");

      setTimeout(() => {
        router.push("/admin/edit?tab=projects");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Error saving project");
    } finally {
      setIsSaving(false);
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

          {/* Section 2: Single Multi-Image Uploader (Max 10 Images with Auto-Purge) */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <MultiImageUploader
              label="Project Showcase Screenshots (Max 10 Images)"
              images={formData.previewImages || []}
              onChange={(imgs) => setFormData({ ...formData, previewImages: imgs })}
              maxImages={10}
              section="projects"
              category={formData.slug || "gallery"}
              helperText="Upload screenshots or paste direct URLs. Uploading beyond 10 replaces the oldest image."
            />
          </div>

          {/* Section 3: Technologies Stack */}
          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
              3. Technologies & Tools
            </h2>
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
              {(formData.technologies || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium text-xs shadow-2xs"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTech(t)}
                    className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
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
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-slate-400 font-heading">
                5. Dedicated Case Study Page (/projects/{formData.slug || "slug"})
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasDetailPage"
                  checked={formData.hasDetailPage ?? true}
                  onChange={(e) => setFormData({ ...formData, hasDetailPage: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="hasDetailPage" className="font-semibold text-zinc-900 select-none cursor-pointer">
                  Enable Case Study Page
                </label>
              </div>
            </div>

            {formData.hasDetailPage && (
              <div className="space-y-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <label className="form-label font-semibold text-zinc-900">Extended Overview (Case Study Story)</label>
                  <textarea
                    rows={4}
                    value={formData.overview || ""}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    placeholder="Comprehensive explanation of architectural design, scale, problem statement, and solution..."
                    className="form-input bg-white resize-none"
                  />
                </div>

                {/* Case 5: Rich Text Editor for Key Features / Highlights */}
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
              <span>{isNew ? "Create & Publish Project" : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
