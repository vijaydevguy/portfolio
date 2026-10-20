"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONFIG } from "../../common";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import Pagination from "../ui/Pagination";
import TableSkeleton from "../ui/TableSkeleton";
import MediaUploader from "../ui/MediaUploader";
import { useDebounce } from "../../hooks/useDebounce";
import { SkillItemData } from "../../hooks/useSkillsData";
import { SKILL_CATEGORIES } from "../../constants/skillCategories";
import toast from "react-hot-toast";

export default function AdminSkillsManager() {
  const [skills, setSkills] = useState<SkillItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Edit Single Existing Skill Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItemData | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCategorySelect, setEditCategorySelect] = useState("Frontend");
  const [editOtherCategory, setEditOtherCategory] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Dialog State
  const [skillToDelete, setSkillToDelete] = useState<SkillItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop table row reordering state
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Toggling status loading state per row
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchSkills = useCallback(
    async (page = currentPage, limit = pageSize, search = debouncedSearch) => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      setLoading(true);
      try {
        const url = new URL(`${CONFIG.BACKEND_URL}/api/skills/admin/all`);
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
          setSkills(json.data || []);
          setTotalItems(json.total || 0);
          setTotalPages(json.totalPages || 1);
        } else {
          toast.error(json.message || "Failed to load skills");
        }
      } catch {
        toast.error("Network error loading skills");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, debouncedSearch]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchSkills(1, pageSize, debouncedSearch);
  }, [debouncedSearch, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchSkills(newPage, pageSize, debouncedSearch);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchSkills(1, newSize, debouncedSearch);
  };

  // Toggle publish / unpublish status inline directly from the table
  const handleTogglePublish = async (skill: SkillItemData) => {
    const token = localStorage.getItem("admin_token");
    if (!token || !skill._id) return;

    const newStatus = !(skill.isVisible !== false);
    setTogglingId(skill._id);

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/skills/${skill._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible: newStatus }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSkills((prev) =>
          prev.map((s) => (s._id === skill._id ? { ...s, isVisible: newStatus } : s))
        );
        toast.success(`"${skill.name}" is now ${newStatus ? "Published" : "Unpublished"}`);
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit Modal for an existing skill
  const handleOpenEdit = (skill: SkillItemData) => {
    setEditingSkill(skill);
    setEditName(skill.name);
    setEditImageUrl(skill.imageUrl);
    const isStandard = SKILL_CATEGORIES.includes(skill.category as any);
    if (isStandard) {
      setEditCategorySelect(skill.category);
      setEditOtherCategory("");
    } else {
      setEditCategorySelect("Other");
      setEditOtherCategory(skill.category || "");
    }
    setEditPublished(skill.isVisible !== false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token || !editingSkill?._id) return;

    if (!editName.trim()) {
      toast.error("Skill title is required");
      return;
    }
    if (!editImageUrl.trim()) {
      toast.error("Skill icon image is required");
      return;
    }

    const finalCategory =
      editCategorySelect === "Other"
        ? editOtherCategory.trim() || "Other"
        : editCategorySelect;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/skills/${editingSkill._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          imageUrl: editImageUrl.trim(),
          category: finalCategory,
          isVisible: editPublished,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Updated "${editName}"`);
        setIsEditModalOpen(false);
        fetchSkills(currentPage, pageSize, debouncedSearch);
      } else {
        toast.error(json.message || "Failed to update skill");
      }
    } catch {
      toast.error("Error updating skill");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Skill
  const handleConfirmDelete = async () => {
    if (!skillToDelete?._id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/skills/${skillToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Deleted "${skillToDelete.name}"`);
        setSkillToDelete(null);
        fetchSkills(currentPage, pageSize, debouncedSearch);
      } else {
        toast.error(json.message || "Failed to delete skill");
      }
    } catch {
      toast.error("Network error deleting skill");
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and Drop Table Reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedRowIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverRowIdx !== index) {
      setDragOverRowIdx(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedRowIdx;

    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      const updated = [...skills];
      const [draggedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      setSkills(updated);

      const token = localStorage.getItem("admin_token");
      if (token) {
        setIsReordering(true);
        try {
          const orderedIds = updated.map((s) => s._id).filter(Boolean);
          const res = await fetch(`${CONFIG.BACKEND_URL}/api/skills/admin/reorder`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderedIds }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            toast.success("Skills order updated!");
          } else {
            toast.error(json.message || "Failed to save order");
            fetchSkills(currentPage, pageSize, debouncedSearch);
          }
        } catch {
          toast.error("Failed to persist order");
          fetchSkills(currentPage, pageSize, debouncedSearch);
        } finally {
          setIsReordering(false);
        }
      }
    }

    setDraggedRowIdx(null);
    setDragOverRowIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedRowIdx(null);
    setDragOverRowIdx(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 font-heading">
            Skills & Technologies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your technical proficiency icons. Upload single or multiple images together, toggle publish status, and drag rows to arrange order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/skills/bulk"
            className="btn-primary !text-xs !py-2.5 !px-5 font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Upload Skills</span>
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
            placeholder="Search skills by title or category..."
            className="form-input bg-white text-xs py-2 pl-9 pr-8 w-full"
          />
          <svg
            className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-700 transition-colors"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{totalItems} total technologies</span>
          {isReordering && <span className="text-blue-600 font-semibold animate-pulse">(Saving order...)</span>}
        </div>
      </div>

      {/* Drag & Arrange Skills Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-3 w-10 text-center">Move</th>
              <th className="py-3 px-4 w-16">Icon</th>
              <th className="py-3 px-4">Title / Toaster Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Publish Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : skills.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <p className="font-semibold text-zinc-700">No skills found</p>
                    <p className="text-xs text-slate-400">Click &ldquo;Upload Skill Images&rdquo; to add icons with toaster names.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-zinc-100">
              {skills.map((skill, idx) => {
                const isBeingDragged = draggedRowIdx === idx;
                const isOver = dragOverRowIdx === idx && !isBeingDragged;
                const isPublished = skill.isVisible !== false;

                return (
                  <tr
                    key={skill._id || idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-150 select-none ${
                      isBeingDragged
                        ? "opacity-30 bg-blue-50/60"
                        : isOver
                        ? "bg-blue-50/80 border-t-2 border-blue-500"
                        : "hover:bg-zinc-50/80"
                    }`}
                  >
                    {/* Drag Grip Column */}
                    <td className="py-3 px-3 text-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600">
                      <div className="flex items-center justify-center p-1 rounded-md hover:bg-zinc-200/60" title="Drag row to rearrange order">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                      </div>
                    </td>

                    {/* Image Preview Thumbnail with Click to Zoom */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setPreviewImage({ url: skill.imageUrl, title: skill.name })}
                        className="relative w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all p-1 flex items-center justify-center shadow-2xs group"
                        title="Click to zoom image preview"
                      >
                        <Image
                          src={skill.imageUrl}
                          alt={skill.name}
                          width={36}
                          height={36}
                          className="object-contain max-h-full max-w-full group-hover:scale-110 transition-transform"
                          unoptimized
                        />
                      </div>
                    </td>

                    {/* Title / Toaster Name */}
                    <td className="py-3 px-4 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (shows in toast)
                        </span>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {skill.category || "Frontend"}
                      </span>
                    </td>

                    {/* Publish / Unpublish Direct Toggle Button */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPublished}
                          onClick={() => handleTogglePublish(skill)}
                          disabled={togglingId === skill._id}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            isPublished ? "bg-emerald-500" : "bg-zinc-300"
                          } ${togglingId === skill._id ? "opacity-50 pointer-events-none" : ""}`}
                          title={isPublished ? "Published (click to unpublish)" : "Unpublished (click to publish)"}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isPublished ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[11px] font-semibold select-none ${
                            isPublished ? "text-emerald-700" : "text-zinc-400"
                          }`}
                        >
                          {isPublished ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </td>

                    {/* Actions: Edit & Red Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(skill)}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Skill"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSkillToDelete(skill)}
                          className="w-7 h-7 rounded-full border border-red-300 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Delete Skill"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Edit Existing Skill Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSavingEdit && setIsEditModalOpen(false)}
        title={editingSkill ? `Edit "${editingSkill.name}"` : "Edit Skill"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="form-label font-semibold text-zinc-900">
              Skill Title / Toaster Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. React.js, TailwindCSS..."
              className="form-input bg-white text-xs py-2 w-full"
            />
          </div>

          <div>
            <label className="form-label font-semibold text-zinc-900">
              Category
            </label>
            <select
              value={editCategorySelect}
              onChange={(e) => setEditCategorySelect(e.target.value)}
              className="form-input bg-white text-xs py-2 w-full"
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          {editCategorySelect === "Other" && (
            <div>
              <label className="form-label font-semibold text-zinc-900">
                Custom Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editOtherCategory}
                onChange={(e) => setEditOtherCategory(e.target.value)}
                placeholder="Enter custom category..."
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>
          )}

          <div>
            <MediaUploader
              label="Skill Icon / Image"
              section="skills"
              category="icons"
              accept="image/*"
              currentValue={editImageUrl}
              onSelect={(url) => setEditImageUrl(url)}
              helperText="Upload SVG, PNG, WebP or paste CDN image URL."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editSkillPublishToggle"
              checked={editPublished}
              onChange={(e) => setEditPublished(e.target.checked)}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="editSkillPublishToggle" className="text-xs font-semibold text-zinc-700 cursor-pointer">
              Publish (Show in marquee skills section)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingEdit}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="btn-primary !text-xs !py-2 !px-5 font-semibold cursor-pointer shadow-sm"
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={`Icon Preview: ${previewImage.title}`}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-32 h-32 rounded-2xl bg-zinc-50 border border-zinc-200 p-4 flex items-center justify-center shadow-inner">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                width={120}
                height={120}
                className="object-contain max-h-full max-w-full"
                unoptimized
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-zinc-900">{previewImage.title}</h3>
              <p className="text-xs text-slate-400 break-all mt-1">{previewImage.url}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(skillToDelete)}
        title="Delete Skill / Technology"
        description={`Are you sure you want to remove "${skillToDelete?.name}"? It will no longer appear in the skills section.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Skill"}
        cancelText="Keep Skill"
        onConfirm={handleConfirmDelete}
        onClose={() => setSkillToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
