"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../../common";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import Pagination from "../ui/Pagination";
import TableSkeleton from "../ui/TableSkeleton";
import RichTextEditor from "../ui/RichTextEditor";
import { useDebounce } from "../../hooks/useDebounce";
import {
  ExperienceItemData,
  EducationData,
} from "../../hooks/useExperienceData";
import toast from "react-hot-toast";

export default function AdminExperienceManager() {
  const [experiences, setExperiences] = useState<ExperienceItemData[]>([]);
  const [educations, setEducations] = useState<EducationData[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Edit / Add Experience Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItemData | null>(null);
  const [formRole, setFormRole] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formType, setFormType] = useState("Full-time");
  const [formPeriod, setFormPeriod] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Delete Experience State
  const [expToDelete, setExpToDelete] = useState<ExperienceItemData | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Education Management State
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationData | null>(null);
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduLocation, setEduLocation] = useState("");
  const [eduGraduated, setEduGraduated] = useState("");
  const [eduScore, setEduScore] = useState("");
  const [eduVisible, setEduVisible] = useState(true);
  const [isSavingEdu, setIsSavingEdu] = useState(false);
  const [eduToDelete, setEduToDelete] = useState<EducationData | null>(null);
  const [isDeletingEdu, setIsDeletingEdu] = useState(false);
  const [togglingEduId, setTogglingEduId] = useState<string | null>(null);

  // Drag and drop table reorder state
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Toggle publish loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchExperiences = useCallback(
    async (page = currentPage, limit = pageSize, search = debouncedSearch) => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      setLoading(true);
      try {
        const url = new URL(`${CONFIG.BACKEND_URL}/api/experiences/admin/all`);
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
          setExperiences(json.experiences || []);
          setTotalItems(json.total || 0);
          setTotalPages(json.totalPages || 1);
          if (json.educations) {
            setEducations(json.educations);
          } else if (json.education) {
            setEducations([json.education]);
          }
        } else {
          toast.error(json.message || "Failed to load experiences");
        }
      } catch {
        toast.error("Network error loading experiences");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, debouncedSearch],
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchExperiences(1, pageSize, debouncedSearch);
  }, [debouncedSearch, pageSize, fetchExperiences]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchExperiences(newPage, pageSize, debouncedSearch);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchExperiences(1, newSize, debouncedSearch);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExp(null);
    setFormRole("");
    setFormCompany("");
    setFormType("Full-time");
    setFormPeriod("");
    setFormLocation("");
    setFormDescription("");
    setFormPublished(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: ExperienceItemData) => {
    setEditingExp(exp);
    setFormRole(exp.role);
    setFormCompany(exp.company);
    setFormType(exp.type || "Full-time");
    setFormPeriod(exp.period || "");
    setFormLocation(exp.location || "");

    // Format description into rich text HTML
    if (typeof exp.description === "string") {
      setFormDescription(exp.description);
    } else if (Array.isArray(exp.description) && exp.description.length > 0) {
      const htmlList = `<ul>${exp.description.map((pt) => `<li>${pt}</li>`).join("")}</ul>`;
      setFormDescription(htmlList);
    } else {
      setFormDescription("");
    }

    setFormPublished(exp.isVisible !== false);
    setIsModalOpen(true);
  };

  // Save Add/Edit Experience
  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    if (!formRole.trim() || !formCompany.trim()) {
      toast.error("Role and Company are required");
      return;
    }

    setIsSavingExp(true);
    const toastId = toast.loading(
      editingExp ? "Updating experience..." : "Creating experience...",
    );

    try {
      const url = editingExp?._id
        ? `${CONFIG.BACKEND_URL}/api/experiences/${editingExp._id}`
        : `${CONFIG.BACKEND_URL}/api/experiences`;
      const method = editingExp?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: formRole.trim(),
          company: formCompany.trim(),
          type: formType.trim(),
          period: formPeriod.trim(),
          location: formLocation.trim(),
          description: formDescription.trim(),
          isVisible: formPublished,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save experience");
      }

      toast.success(
        editingExp ? "Experience updated!" : "Experience created!",
        { id: toastId },
      );
      setIsModalOpen(false);
      fetchExperiences(currentPage, pageSize, debouncedSearch);
    } catch (err: any) {
      toast.error(err.message || "Error saving experience", { id: toastId });
    } finally {
      setIsSavingExp(false);
    }
  };

  // Toggle publish / unpublish status inline directly from the table
  const handleTogglePublish = async (exp: ExperienceItemData) => {
    const token = localStorage.getItem("admin_token");
    if (!token || !exp._id) return;

    const newStatus = !(exp.isVisible !== false);
    setTogglingId(exp._id);

    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/experiences/${exp._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isVisible: newStatus }),
        },
      );

      const json = await res.json();
      if (res.ok && json.success) {
        setExperiences((prev) =>
          prev.map((item) =>
            item._id === exp._id ? { ...item, isVisible: newStatus } : item,
          ),
        );
        toast.success(
          `"${exp.role}" is now ${newStatus ? "Published" : "Unpublished"}`,
        );
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Experience
  const handleConfirmDelete = async () => {
    if (!expToDelete?._id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/experiences/${expToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Deleted "${expToDelete.role}"`);
        setExpToDelete(null);
        fetchExperiences(currentPage, pageSize, debouncedSearch);
      } else {
        toast.error(json.message || "Failed to delete");
      }
    } catch {
      toast.error("Network error deleting experience");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Add Education Modal
  const handleOpenAddEdu = () => {
    setEditingEdu(null);
    setEduDegree("");
    setEduField("");
    setEduInstitution("");
    setEduLocation("");
    setEduGraduated("");
    setEduScore("");
    setEduVisible(true);
    setIsEduModalOpen(true);
  };

  // Open Edit Education Modal
  const handleOpenEditEdu = (edu: EducationData) => {
    setEditingEdu(edu);
    setEduDegree(edu.degree || "");
    setEduField(edu.field || "");
    setEduInstitution(edu.institution || "");
    setEduLocation(edu.location || "");
    setEduGraduated(edu.graduated || "");
    setEduScore(edu.score || "");
    setEduVisible(edu.isVisible !== false);
    setIsEduModalOpen(true);
  };

  // Save (Create or Update) Education Item
  const handleSaveEduItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduDegree.trim() || !eduInstitution.trim()) {
      toast.error("Degree and Institution are required");
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsSavingEdu(true);
    const toastId = toast.loading(
      editingEdu ? "Updating education..." : "Adding education...",
    );

    try {
      const payload = {
        degree: eduDegree.trim(),
        field: eduField.trim(),
        institution: eduInstitution.trim(),
        location: eduLocation.trim(),
        graduated: eduGraduated.trim(),
        score: eduScore.trim(),
        isVisible: eduVisible,
      };

      const url = editingEdu?._id
        ? `${CONFIG.BACKEND_URL}/api/experiences/education/${editingEdu._id}`
        : `${CONFIG.BACKEND_URL}/api/experiences/education`;

      const method = editingEdu?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save education");
      }

      toast.success(
        editingEdu ? "Education updated successfully!" : "Education added successfully!",
        { id: toastId },
      );
      setIsEduModalOpen(false);
      fetchExperiences();
    } catch (err: any) {
      toast.error(err.message || "Failed to save education", { id: toastId });
    } finally {
      setIsSavingEdu(false);
    }
  };

  // Toggle Education Publish / Visibility Status
  const handleToggleEduVisibility = async (edu: EducationData) => {
    if (!edu._id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const newStatus = !(edu.isVisible !== false);
    setTogglingEduId(edu._id);

    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/experiences/education/${edu._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isVisible: newStatus }),
        },
      );

      const json = await res.json();
      if (res.ok && json.success) {
        setEducations((prev) =>
          prev.map((item) =>
            item._id === edu._id ? { ...item, isVisible: newStatus } : item,
          ),
        );
        toast.success(
          `"${edu.degree}" is now ${newStatus ? "Published" : "Unpublished"}`,
        );
      } else {
        toast.error(json.message || "Failed to update visibility");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setTogglingEduId(null);
    }
  };

  // Confirm Delete Education
  const handleConfirmDeleteEdu = async () => {
    if (!eduToDelete?._id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsDeletingEdu(true);
    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/experiences/education/${eduToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Deleted "${eduToDelete.degree}"`);
        setEduToDelete(null);
        fetchExperiences();
      } else {
        toast.error(json.message || "Failed to delete education");
      }
    } catch {
      toast.error("Network error deleting education");
    } finally {
      setIsDeletingEdu(false);
    }
  };

  // Drag & drop row reordering
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
    const sourceIndex = sourceIndexStr
      ? parseInt(sourceIndexStr, 10)
      : draggedRowIdx;

    if (
      sourceIndex !== null &&
      !isNaN(sourceIndex) &&
      sourceIndex !== targetIndex
    ) {
      const updated = [...experiences];
      const [draggedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      setExperiences(updated);

      const token = localStorage.getItem("admin_token");
      if (token) {
        setIsReordering(true);
        try {
          const orderedIds = updated.map((item) => item._id).filter(Boolean);
          const res = await fetch(
            `${CONFIG.BACKEND_URL}/api/experiences/admin/reorder`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ orderedIds }),
            },
          );
          const json = await res.json();
          if (res.ok && json.success) {
            toast.success("Experience timeline order saved!");
          } else {
            toast.error(json.message || "Failed to save order");
            fetchExperiences(currentPage, pageSize, debouncedSearch);
          }
        } catch {
          toast.error("Failed to persist order");
          fetchExperiences(currentPage, pageSize, debouncedSearch);
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
    <div className="space-y-8">
      {/* 1. Header with Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 font-heading">
            Work Experience Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add or edit positions, companies, employment types, periods, and
            accomplishments. Drag rows to arrange timeline order.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn-primary !text-xs !py-2.5 !px-5 font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>Add Work Experience</span>
        </button>
      </div>

      {/* 2. Search and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or type..."
            className="form-input bg-white text-xs py-2 pl-9 pr-8 w-full"
          />
          <svg
            className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-700"
              title="Clear search"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{totalItems} total experiences</span>
          {isReordering && (
            <span className="text-blue-600 font-semibold animate-pulse">
              (Saving order...)
            </span>
          )}
        </div>
      </div>

      {/* 3. Work Experiences Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-3 w-10 text-center">Move</th>
              <th className="py-3 px-4">Role / Title</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Period / Dates</th>
              <th className="py-3 px-4 text-center">Publish Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={7} rows={4} />
          ) : experiences.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">💼</span>
                    <p className="font-semibold text-zinc-700">
                      No experiences found
                    </p>
                    <p className="text-xs text-slate-400">
                      Click &ldquo;Add Work Experience&rdquo; to create your
                      first entry.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-zinc-100">
              {experiences.map((exp, idx) => {
                const isBeingDragged = draggedRowIdx === idx;
                const isOver = dragOverRowIdx === idx && !isBeingDragged;
                const isPublished = exp.isVisible !== false;

                return (
                  <tr
                    key={exp._id || idx}
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
                    {/* Move Grip */}
                    <td className="py-3 px-3 text-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600">
                      <div
                        className="flex items-center justify-center p-1 rounded-md hover:bg-zinc-200/60"
                        title="Drag to rearrange order"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      <div>
                        <span>{exp.role}</span>
                        {exp.description && exp.description.length > 0 && (
                          <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                            {exp.description.length} bullet point
                            {exp.description.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4 font-semibold text-[#1D4ED8]">
                      {exp.company}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {exp.type}
                      </span>
                    </td>

                    {/* Period */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {exp.period || (
                        <span className="text-slate-400 italic">
                          Ongoing / Not specified
                        </span>
                      )}
                    </td>

                    {/* Publish / Unpublish Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPublished}
                          onClick={() => handleTogglePublish(exp)}
                          disabled={togglingId === exp._id}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            isPublished ? "bg-emerald-500" : "bg-zinc-300"
                          } ${togglingId === exp._id ? "opacity-50 pointer-events-none" : ""}`}
                          title={
                            isPublished
                              ? "Published (click to unpublish)"
                              : "Unpublished (click to publish)"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isPublished ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        {/* Status text commented as requested:
                        <span
                          className={`text-[11px] font-semibold select-none ${
                            isPublished ? "text-emerald-700" : "text-zinc-400"
                          }`}
                        >
                          {isPublished ? "Published" : "Unpublished"}
                        </span>
                        */}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Experience"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpToDelete(exp)}
                          className="w-7 h-7 rounded-full border border-red-300 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Delete Experience"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
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

        {/* Pagination inside table card */}
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

      {/* 4. Education History Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <h3 className="text-lg font-bold text-zinc-950 font-heading">
                Education History
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-700">
                {educations.length} {educations.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage your degrees, certifications, or educational background displayed on your portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddEdu}
            className="btn-primary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Education
          </button>
        </div>

        {educations.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
            <span className="text-2xl block mb-2">🎓</span>
            <p className="text-sm font-semibold text-zinc-800">No education entries yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Click &quot;Add Education&quot; to showcase your degrees, diplomas, or institutions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educations.map((edu) => {
              const isVisible = edu.isVisible !== false;
              const isToggling = togglingEduId === edu._id;
              return (
                <div
                  key={edu._id || `${edu.degree}-${edu.institution}`}
                  className={`relative p-5 rounded-xl border transition-all ${
                    isVisible
                      ? "bg-white border-zinc-200 shadow-xs hover:border-zinc-300"
                      : "bg-zinc-50/60 border-zinc-200/80 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-950 font-heading">
                          {edu.degree}
                        </span>
                        {edu.field && (
                          <span className="text-xs text-slate-600 font-medium">
                            in {edu.field}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5 truncate">
                        {edu.institution}
                      </p>
                      {(edu.location || edu.graduated || edu.score) && (
                        <div className="flex items-center gap-2 flex-wrap mt-2.5 text-[11px] text-zinc-500">
                          {edu.graduated && (
                            <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md font-medium text-zinc-700">
                              🎓 {edu.graduated}
                            </span>
                          )}
                          {edu.score && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md font-semibold">
                              ⭐ {edu.score}
                            </span>
                          )}
                          {edu.location && (
                            <span className="text-zinc-500">📍 {edu.location}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions: Visibility Toggle, Edit, Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Publish / Unpublish Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isVisible}
                        disabled={isToggling}
                        onClick={() => handleToggleEduVisibility(edu)}
                        title={isVisible ? "Published - Click to unpublish" : "Unpublished - Click to publish"}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isToggling ? "opacity-50 cursor-wait" : ""
                        } ${isVisible ? "bg-emerald-500" : "bg-zinc-300"}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditEdu(edu)}
                        className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit education"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* Delete Button (Trash Icon) */}
                      <button
                        type="button"
                        onClick={() => setEduToDelete(edu)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete education"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Education Modal */}
      <Modal
        isOpen={isEduModalOpen}
        onClose={() => !isSavingEdu && setIsEduModalOpen(false)}
        title={
          editingEdu
            ? `Edit Education: ${editingEdu.degree}`
            : "Add Education"
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEduItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label font-semibold text-zinc-900">
                Degree / Qualification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={eduDegree}
                onChange={(e) => setEduDegree(e.target.value)}
                placeholder="e.g. B.E., B.Tech, M.S., Diploma"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Field of Study / Major
              </label>
              <input
                type="text"
                value={eduField}
                onChange={(e) => setEduField(e.target.value)}
                placeholder="e.g. Computer Science Engineering"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label font-semibold text-zinc-900">
                Institution / University <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={eduInstitution}
                onChange={(e) => setEduInstitution(e.target.value)}
                placeholder="e.g. Anna University, Stanford University"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Location
              </label>
              <input
                type="text"
                value={eduLocation}
                onChange={(e) => setEduLocation(e.target.value)}
                placeholder="e.g. Chennai, Tamil Nadu"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Graduation / Year
              </label>
              <input
                type="text"
                value={eduGraduated}
                onChange={(e) => setEduGraduated(e.target.value)}
                placeholder="e.g. June 2023 or 2019 - 2023"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label font-semibold text-zinc-900">
                Score / Grade / Honors
              </label>
              <input
                type="text"
                value={eduScore}
                onChange={(e) => setEduScore(e.target.value)}
                placeholder="e.g. CGPA: 8.5 / 10, First Class with Distinction"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <span className="text-xs font-semibold text-zinc-900 block">
                Publish Status
              </span>
              <span className="text-[11px] text-slate-500">
                {eduVisible
                  ? "Visible on landing page education section"
                  : "Saved as draft, hidden from portfolio visitors"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={eduVisible}
                onClick={() => setEduVisible((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  eduVisible ? "bg-emerald-500" : "bg-zinc-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    eduVisible ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold select-none ${
                  eduVisible ? "text-emerald-700" : "text-zinc-500"
                }`}
              >
                {eduVisible ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsEduModalOpen(false)}
              disabled={isSavingEdu}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdu}
              className="btn-primary !text-xs !py-2 !px-5 font-semibold cursor-pointer shadow-sm"
            >
              {isSavingEdu
                ? "Saving..."
                : editingEdu
                  ? "Save Changes"
                  : "Add Education"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Education Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(eduToDelete)}
        title="Delete Education Entry"
        description={`Are you sure you want to delete "${eduToDelete?.degree}${eduToDelete?.institution ? ` from ${eduToDelete.institution}` : ""}"? This cannot be undone.`}
        confirmText={isDeletingEdu ? "Deleting..." : "Delete Education"}
        cancelText="Keep Education"
        onConfirm={handleConfirmDeleteEdu}
        onClose={() => setEduToDelete(null)}
        isDestructive={true}
        isLoading={isDeletingEdu}
      />

      {/* 5. Add / Edit Experience Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSavingExp && setIsModalOpen(false)}
        title={
          editingExp
            ? `Edit Experience: ${editingExp.role}`
            : "Add Work Experience"
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveExperience} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label font-semibold text-zinc-900">
                Job Title / Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Software Development Engineer"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="e.g. Best Labz, Google"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Employment Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="form-input bg-white text-xs py-2 w-full"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="form-label font-semibold text-zinc-900">
                Period / Dates
              </label>
              <input
                type="text"
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
                placeholder="e.g. Dec 2025 – Present"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label font-semibold text-zinc-900">
                Location
              </label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Remote, Bangalore, On-site"
                className="form-input bg-white text-xs py-2 w-full"
              />
            </div>
          </div>

          {/* Key Accomplishments / Description with RichTextEditor */}
          <div className="pt-2 border-t border-zinc-100">
            <RichTextEditor
              label="Key Accomplishments & Role Description"
              value={formDescription}
              onChange={(val) => setFormDescription(val)}
              placeholder="Write points, responsibilities, bullet highlights, achievements, or project links..."
              helperText="Use the rich formatting toolbar above for bold, italic, bullet lists, numbered lists, links, or code."
            />
          </div>

          {/* Publish / Unpublish Toggle Switch in Modal */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <span className="text-xs font-semibold text-zinc-900 block">
                Publish Status
              </span>
              <span className="text-[11px] text-slate-500">
                {formPublished
                  ? "Visible on landing page work experience timeline"
                  : "Saved as draft, hidden from public visitors"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={formPublished}
                onClick={() => setFormPublished((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  formPublished ? "bg-emerald-500" : "bg-zinc-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formPublished ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold select-none ${
                  formPublished ? "text-emerald-700" : "text-zinc-500"
                }`}
              >
                {formPublished ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSavingExp}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingExp}
              className="btn-primary !text-xs !py-2 !px-5 font-semibold cursor-pointer shadow-sm"
            >
              {isSavingExp
                ? "Saving..."
                : editingExp
                  ? "Save Changes"
                  : "Create Experience"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(expToDelete)}
        title="Delete Work Experience"
        description={`Are you sure you want to remove "${expToDelete?.role} at ${expToDelete?.company}"? This will permanently remove it from your timeline.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Experience"}
        cancelText="Keep Experience"
        onConfirm={handleConfirmDelete}
        onClose={() => setExpToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
