"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../../common";
import ConfirmDialog from "../ui/ConfirmDialog";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import {
  LuTag,
  LuFolderGit2,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuX,
  LuCheck,
  LuGripVertical,
  LuSave,
  LuRotateCcw,
} from "react-icons/lu";

export interface ProjectOptionItem {
  _id: string;
  type: "category" | "projectType";
  name: string;
  order: number;
  isDefault?: boolean;
}

export default function AdminProjectOptionsManager() {
  const [activeTab, setActiveTab] = useState<"category" | "projectType">("category");
  const [categories, setCategories] = useState<ProjectOptionItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectOptionItem[]>([]);
  const [initialCategories, setInitialCategories] = useState<ProjectOptionItem[]>([]);
  const [initialProjectTypes, setInitialProjectTypes] = useState<ProjectOptionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Drag and Drop reordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Modal State for Adding
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<ProjectOptionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options`);
      const json = await res.json();
      if (res.ok && json.success) {
        const cats = json.categories || [];
        const pts = json.projectTypes || [];
        setCategories(cats);
        setProjectTypes(pts);
        setInitialCategories(cats);
        setInitialProjectTypes(pts);
        setHasOrderChanged(false);
      } else {
        toast.error(json.message || "Failed to load project options");
      }
    } catch {
      toast.error("Network error fetching project options");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const currentList = activeTab === "category" ? categories : projectTypes;
  const setCurrentList = (newList: ProjectOptionItem[]) => {
    if (activeTab === "category") {
      setCategories(newList);
    } else {
      setProjectTypes(newList);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const updated = [...currentList];
    const [movedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    setDraggedIdx(targetIdx);
    setCurrentList(updated);
    setHasOrderChanged(true);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Cancel / Reset Reordering back to initial server state
  const handleCancelReorder = () => {
    if (activeTab === "category") {
      setCategories([...initialCategories]);
    } else {
      setProjectTypes([...initialProjectTypes]);
    }
    setHasOrderChanged(false);
    toast("Arrangement reverted to previous order.", { icon: "↩️" });
  };

  // Explicit Save Arrangement Order
  const handleSaveOrder = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("You must be logged in as an admin.");
      return;
    }

    setIsSavingOrder(true);
    try {
      const items = currentList.map((item, idx) => ({
        id: item._id,
        order: idx + 1,
      }));

      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          `${activeTab === "category" ? "Category" : "Project type"} order saved successfully!`
        );
        if (activeTab === "category") {
          setInitialCategories([...currentList]);
        } else {
          setInitialProjectTypes([...currentList]);
        }
        setHasOrderChanged(false);
      } else {
        toast.error(json.message || "Failed to save arrangement order");
        fetchOptions();
      }
    } catch {
      toast.error("Network error saving order");
      fetchOptions();
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    if (currentList.length >= 10) {
      toast.error(
        `Maximum limit of 10 ${activeTab === "category" ? "categories" : "project types"} reached. Delete one first to add new.`
      );
      return;
    }
    setNewName("");
    setIsAddModalOpen(true);
  };

  // Create Option via Modal
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("You must be logged in as an admin.");
      return;
    }

    if (currentList.length >= 10) {
      toast.error(
        `Maximum limit of 10 ${activeTab === "category" ? "categories" : "project types"} reached.`
      );
      return;
    }

    if (!newName.trim()) {
      toast.error("Please enter a name.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: activeTab,
          name: newName.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          json.message || `${activeTab === "category" ? "Category" : "Project type"} created!`
        );
        setNewName("");
        setIsAddModalOpen(false);
        fetchOptions();
      } else {
        toast.error(json.message || "Failed to create option");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error creating option");
    } finally {
      setIsAdding(false);
    }
  };

  // Start Editing
  const startEditing = (item: ProjectOptionItem) => {
    setEditingId(item._id);
    setEditingName(item.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Save Edit
  const handleUpdate = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("You must be logged in as an admin.");
      return;
    }

    if (!editingName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Updated successfully!");
        cancelEditing();
        fetchOptions();
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating option");
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("You must be logged in as an admin.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/project-options/${itemToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Deleted successfully!");
        setItemToDelete(null);
        fetchOptions();
      } else {
        toast.error(json.message || `Failed to delete ${itemToDelete.type === "category" ? "category" : "project type"}.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error while deleting option. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 font-heading">
            Project Taxonomy & Dropdowns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally manage your dynamic Project Categories and Project Types.
            Drag rows to rearrange the order, then click Save Order.
          </p>
        </div>

        {/* Top Actions: Add Button + Save / Cancel */}
        <div className="flex flex-wrap items-center gap-2.5">
          {hasOrderChanged && (
            <>
              <button
                type="button"
                onClick={handleCancelReorder}
                disabled={isSavingOrder}
                className="btn-secondary !text-xs !py-2 !px-3.5 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Discard reordering changes"
              >
                <LuRotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="btn-primary !text-xs !py-2 !px-4 font-semibold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <LuSave className="w-4 h-4" />
                <span>{isSavingOrder ? "Saving..." : "Save Order"}</span>
              </button>
            </>
          )}

          {/* Add New Button Trigger */}
          <button
            type="button"
            onClick={openAddModal}
            disabled={currentList.length >= 10}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              currentList.length >= 10
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200/70 cursor-not-allowed"
                : "bg-[#1D4ED8] hover:bg-blue-700 text-white shadow-sm active:scale-95"
            }`}
          >
            <LuPlus className="w-4 h-4" />
            <span>Add New {activeTab === "category" ? "Category" : "Project Type"}</span>
          </button>
        </div>
      </div>

      {/* Tabs and Count Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 border border-zinc-200/70 w-fit">
          <button
            type="button"
            onClick={() => {
              if (hasOrderChanged) {
                if (window.confirm("You have unsaved arrangement changes. Switch tabs and discard?")) {
                  handleCancelReorder();
                  setActiveTab("category");
                  cancelEditing();
                }
              } else {
                setActiveTab("category");
                cancelEditing();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "category"
                ? "bg-white text-[#1D4ED8] shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <LuTag className="w-4 h-4" />
            <span>Project Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasOrderChanged) {
                if (window.confirm("You have unsaved arrangement changes. Switch tabs and discard?")) {
                  handleCancelReorder();
                  setActiveTab("projectType");
                  cancelEditing();
                }
              } else {
                setActiveTab("projectType");
                cancelEditing();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "projectType"
                ? "bg-white text-[#1D4ED8] shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <LuFolderGit2 className="w-4 h-4" />
            <span>Project Types ({projectTypes.length})</span>
          </button>
        </div>

        {/* Capacity Indicator Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
              currentList.length >= 10
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-blue-50 text-[#1D4ED8] border-blue-200/60"
            }`}
          >
            {currentList.length}/10 {currentList.length >= 10 ? "Limit Reached" : "Active"}
          </span>
        </div>
      </div>

      {/* List Table with Drag & Arrange */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-950 font-heading">
              Current {activeTab === "category" ? "Categories" : "Project Types"}
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              (Drag rows to rearrange order)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">
              {currentList.length} total
            </span>

            {hasOrderChanged && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelReorder}
                  disabled={isSavingOrder}
                  className="btn-secondary !text-xs !py-1 !px-2.5 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Discard changes"
                >
                  <LuRotateCcw className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={isSavingOrder}
                  className="btn-primary !text-xs !py-1 !px-3 font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LuSave className="w-3.5 h-3.5" />
                  <span>{isSavingOrder ? "Saving..." : "Save"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-10 bg-zinc-100 rounded-xl" />
            <div className="h-10 bg-zinc-100 rounded-xl" />
            <div className="h-10 bg-zinc-100 rounded-xl" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No {activeTab === "category" ? "categories" : "project types"} found. Click the Add button above.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 select-none">
            {currentList.map((item, index) => {
              const isEditing = editingId === item._id;
              const isBeingDragged = draggedIdx === index;

              return (
                <div
                  key={item._id}
                  draggable={!isEditing}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`px-6 py-3.5 flex items-center justify-between gap-4 transition-all ${
                    isBeingDragged
                      ? "bg-blue-50/70 border-y border-blue-200 opacity-60 scale-[0.99]"
                      : "hover:bg-zinc-50/80 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="text-zinc-400 hover:text-zinc-800 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md hover:bg-zinc-100 transition-colors"
                      title="Drag to reorder"
                    >
                      <LuGripVertical className="w-4 h-4" />
                    </div>

                    <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-500 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(item._id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                          className="form-input !py-1.5 !px-3 text-xs bg-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate(item._id)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Save"
                        >
                          <LuCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <LuX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 truncate">
                          {item.name}
                        </span>
                        {item.isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1D4ED8] text-[10px] font-semibold border border-blue-200/60">
                            Default
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-[#1D4ED8] hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit name"
                      >
                        <LuPencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Action Bar (Shown when arrangement order changes) */}
      {hasOrderChanged && (
        <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs text-zinc-800 font-medium text-center sm:text-left">
              You have reordered the {activeTab === "category" ? "categories" : "project types"}. Click Save Order to apply changes or Cancel to discard.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancelReorder}
              disabled={isSavingOrder}
              className="btn-secondary !text-xs !py-2.5 !px-4 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LuRotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="btn-primary !text-xs !py-2.5 !px-6 font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 flex-shrink-0 active:scale-95"
            >
              <LuSave className="w-4 h-4" />
              <span>{isSavingOrder ? "Saving Changes..." : "Save Order"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Adding New Category / Project Type */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${activeTab === "category" ? "Category" : "Project Type"}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label font-semibold text-zinc-900">
              {activeTab === "category" ? "Category Name" : "Project Type Name"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                activeTab === "category"
                  ? "e.g. AI & Machine Learning, Mobile Apps..."
                  : "e.g. Client Work, Open Source, Personal..."
              }
              className="form-input bg-zinc-50/60 text-xs w-full"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {activeTab === "category"
                ? "This category will appear in project dropdowns and as a filter pill on your portfolio (max 10)."
                : "This type will appear in project dropdowns and badges (max 10)."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
              className="btn-secondary !text-xs !py-2.5 !px-4 !rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !newName.trim()}
              className="btn-primary !text-xs !py-2.5 !px-5 !rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <LuPlus className="w-4 h-4" />
              <span>{isAdding ? "Adding..." : "Add to List"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title={`Delete ${itemToDelete?.type === "category" ? "Category" : "Project Type"}?`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? Any projects currently assigned to this ${
          itemToDelete?.type === "category" ? "category" : "project type"
        } will automatically fallback to "All" so that no projects are lost or broken.`}
        confirmText="Delete & Reassign to All"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}
