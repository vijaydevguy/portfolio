"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONFIG } from "@/app/common";
import { ProjectItem } from "@/app/hooks/useProjectsData";
import toast from "react-hot-toast";

export default function ProjectOrderPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/admin/all?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setProjects(json.data || []);
        } else {
          toast.error(json.message || "Failed to load projects");
        }
      } catch {
        toast.error("Network error loading projects");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  // Drag and drop reordering logic
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const updated = [...projects];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);
    setDraggedIdx(targetIdx);
    setProjects(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= projects.length) return;
    const updated = [...projects];
    const [item] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, item);
    setProjects(updated);
  };

  const saveNewOrder = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsSaving(true);
    try {
      const items = projects.map((p, idx) => ({
        id: p._id || p.id,
        order: idx + 1,
      }));

      const res = await fetch(`${CONFIG.BACKEND_URL}/api/projects/admin/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Project order saved successfully!");
        setTimeout(() => router.push("/admin/edit?tab=projects"), 900);
      } else {
        toast.error(json.message || "Failed to save order");
      }
    } catch {
      toast.error("Network error saving project order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/edit?tab=projects"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-2xs transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 font-heading">
                Reorder Projects
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and drop projects to rearrange the exact display order on your portfolio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/edit?tab=projects"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 shadow-2xs"
            >
              Cancel
            </Link>
            <button
              onClick={saveNewOrder}
              disabled={isSaving || loading}
              className="btn-primary !rounded-xl !py-2 !px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Save Sequence</span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Project List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl">
            <p className="text-sm font-semibold text-zinc-700">No projects to reorder.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {projects.map((project, idx) => {
              const thumb = project.previewImages?.[0] || "";
              const isDraggingThis = draggedIdx === idx;

              return (
                <div
                  key={project._id || project.slug}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing bg-white ${
                    isDraggingThis
                      ? "border-blue-500 bg-blue-50/50 scale-[1.01] shadow-md ring-2 ring-blue-400/20"
                      : "border-zinc-200/90 hover:border-zinc-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Drag Handle */}
                    <div className="text-slate-400 hover:text-zinc-700 flex flex-col items-center justify-center cursor-grab">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    </div>

                    {/* Position badge */}
                    <span className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-14 h-9 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200 flex-shrink-0">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={project.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400">
                          No Img
                        </div>
                      )}
                    </div>

                    {/* Title & Info */}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-zinc-900 truncate">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-medium text-blue-600">{project.category}</span>
                        <span>•</span>
                        <span>{project.projectType}</span>
                        {project.isFeaturedOnHome && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-semibold">Home Featured ★</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Manual Arrow Controls (Mobile friendly fallback) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, idx - 1)}
                      className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Up"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={idx === projects.length - 1}
                      onClick={() => moveItem(idx, idx + 1)}
                      className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Down"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200">
          <Link
            href="/admin/edit?tab=projects"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
          >
            Cancel
          </Link>
          <button
            onClick={saveNewOrder}
            disabled={isSaving || loading}
            className="btn-primary !rounded-xl !py-2.5 !px-6 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
          >
            {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>Save Sequence</span>
          </button>
        </div>
      </div>
    </div>
  );
}
