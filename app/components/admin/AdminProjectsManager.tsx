"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONFIG } from "../../common";
import ConfirmDialog from "../ui/ConfirmDialog";
import Pagination from "../ui/Pagination";
import TableSkeleton from "../ui/TableSkeleton";
import { ProjectItem } from "../../hooks/useProjectsData";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";
import {
  LuPlus,
  LuSearch,
  LuX,
  LuTrash2,
  LuArrowUpDown,
  LuPencil,
} from "react-icons/lu";

export default function AdminProjectsManager() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Delete Dialog State
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(
    async (page = currentPage, limit = pageSize, search = debouncedSearch) => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      setLoading(true);
      try {
        const url = new URL(`${CONFIG.BACKEND_URL}/api/projects/admin/all`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (search.trim()) {
          url.searchParams.set("search", search.trim());
        }

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setProjects(json.data || []);
          setTotalItems(json.total || 0);
          setTotalPages(json.totalPages || 1);
        } else {
          toast.error(json.message || "Failed to load projects");
        }
      } catch {
        toast.error("Network error loading projects");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, debouncedSearch],
  );

  // Trigger search whenever debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
    fetchProjects(1, pageSize, debouncedSearch);
  }, [debouncedSearch, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProjects(newPage, pageSize, debouncedSearch);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchProjects(1, newSize, debouncedSearch);
  };

  // Case 1: Toggle Home Featured (Maximum 3 projects, react-hot-toast error if exceeds)
  const handleToggleHomeFeatured = async (project: ProjectItem) => {
    const token = localStorage.getItem("admin_token");
    if (!token || !project._id) return;

    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/projects/admin/toggle-home/${project._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        // Show react toast error message when exceeding 3
        toast.error(
          json.message || "Only 3 projects can be featured on the Home Page!",
        );
        return;
      }

      toast.success(json.message || "Home featured status updated");
      setProjects((prev) =>
        prev.map((p) =>
          p._id === project._id
            ? { ...p, isFeaturedOnHome: !p.isFeaturedOnHome }
            : p,
        ),
      );
    } catch {
      toast.error("Failed to update home featured status");
    }
  };

  const toggleVisibility = async (project: ProjectItem) => {
    const token = localStorage.getItem("admin_token");
    if (!token || !project._id) return;

    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/projects/${project._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isVisible: !project.isVisible }),
        },
      );
      if (res.ok) {
        toast.success("Visibility toggled");
        setProjects((prev) =>
          prev.map((p) =>
            p._id === project._id ? { ...p, isVisible: !p.isVisible } : p,
          ),
        );
      }
    } catch {
      toast.error("Visibility toggle failed");
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete?._id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/projects/${projectToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Project deleted successfully");
        fetchProjects(currentPage, pageSize, searchQuery);
      } else {
        toast.error(json.message || "Failed to delete project");
      }
    } catch {
      toast.error("Network error deleting project");
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const homeFeaturedCount = projects.filter((p) => p.isFeaturedOnHome).length;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 font-heading">
            My Projects Showcase
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your project portfolio, pick up to 3 featured home projects,
            and arrange display order.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Case 3: Dedicated Page for Drag and Drop Arrange Order */}
          <Link
            href="/admin/projects/order"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LuArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>Arrange Order</span>
          </Link>

          <Link
            href="/admin/projects/new"
            className="btn-primary !rounded-xl !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            <span>Add New Project</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, category, or role..."
            className="form-input bg-white text-xs py-2 pl-9 pr-8 w-full"
          />
          <LuSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-700 transition-colors"
              title="Clear search"
            >
              <LuX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Home Showcase:</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold font-mono text-[11px]">
            {homeFeaturedCount} / 3 Selected
          </span>
        </div>
      </div>

      {/* Projects Table with Case 7 Skeleton loader */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Screens</th>
              <th className="py-3 px-4 text-center">Home (Max 3)</th>
              <th className="py-3 px-4 text-center">Visible</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={pageSize > 5 ? 5 : pageSize} columns={7} />
          ) : projects.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500">
                  <p className="font-semibold text-zinc-700">
                    No projects found.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search or add a new project.
                  </p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-zinc-100">
              {projects.map((p) => {
                const thumb = p.previewImages?.[0] || "";
                return (
                  <tr
                    key={p._id || p.slug}
                    className="hover:bg-zinc-50/60 transition-colors"
                  >
                    {/* Project & Path */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <div className="w-12 h-8 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200 flex-shrink-0">
                            <Image
                              src={thumb}
                              alt={p.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 flex-shrink-0 font-medium">
                            No Img
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-900">
                            {p.title}
                          </div>
                          {/* Show path cleanly */}
                          <div className="text-[10px] text-slate-400 font-mono">
                            /projects/{p.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.projectType === "Professional"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {p.projectType}
                      </span>
                    </td>

                    {/* Screens */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {p.previewImages?.length || 0} images
                    </td>

                    {/* Case 1: Home Page Toggle (Max 3, toast error if exceeded) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.isFeaturedOnHome}
                        onClick={() => handleToggleHomeFeatured(p)}
                        title={
                          p.isFeaturedOnHome
                            ? "Remove from Home Page"
                            : "Feature on Home Page"
                        }
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          p.isFeaturedOnHome ? "bg-amber-500" : "bg-zinc-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            p.isFeaturedOnHome
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Visibility Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.isVisible}
                        onClick={() => toggleVisibility(p)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          p.isVisible ? "bg-emerald-500" : "bg-zinc-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            p.isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions: Edit & Case 4 Delete button */}
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/admin/projects/${p._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <LuPencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>

                      {/* Case 4: Rounded delete button, red border, red icon, highlighted on hover */}
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(p)}
                        title="Delete Project"
                        className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        <LuTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>

        {/* Case 7: Reusable Pagination Component */}
        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project?"
        description={`Are you sure you want to permanently delete "${projectToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
