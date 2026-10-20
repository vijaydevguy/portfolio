"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { CONFIG } from "../../common";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import Pagination from "../ui/Pagination";
import TableSkeleton from "../ui/TableSkeleton";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";

export interface ContactMessageData {
  _id: string;
  name: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  fullPhoneNumber?: string;
  reason: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  notes?: string;
  createdAt: string;
}

interface AdminContactManagerProps {
  isArchivedView?: boolean;
}

const AVAILABLE_STATUSES: {
  key: "unread" | "read" | "replied";
  label: string;
  dotColor: string;
}[] = [
  { key: "unread", label: "Unread", dotColor: "bg-amber-500" },
  { key: "read", label: "Read", dotColor: "bg-blue-500" },
  { key: "replied", label: "Replied", dotColor: "bg-emerald-500" },
];

export default function AdminContactManager({
  isArchivedView = false,
}: AdminContactManagerProps) {
  const [messages, setMessages] = useState<ContactMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Multi-select status filter (for active inbox: unread, read, replied)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  // Message details modal
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Delete message dialog (permanent deletion)
  const [messageToDelete, setMessageToDelete] =
    useState<ContactMessageData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch messages from backend
  const fetchMessages = useCallback(
    async (
      page = currentPage,
      limit = pageSize,
      search = debouncedSearch,
      statuses = selectedStatuses,
    ) => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      setLoading(true);
      try {
        const url = new URL(`${CONFIG.BACKEND_URL}/api/contact/admin/all`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));

        if (search.trim()) {
          url.searchParams.set("search", search.trim());
        }

        if (isArchivedView) {
          url.searchParams.set("status", "archived");
          url.searchParams.set("includeArchived", "true");
        } else {
          if (statuses.length > 0) {
            url.searchParams.set("status", statuses.join(","));
          }
        }

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setMessages(json.messages || []);
          setTotalItems(json.total || 0);
          setTotalPages(json.totalPages || 1);
          setUnreadCount(json.unreadCount || 0);
          setArchivedCount(json.archivedCount || 0);
        } else {
          toast.error(json.message || "Failed to load contact inquiries");
        }
      } catch {
        toast.error("Network error loading contact inquiries");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, debouncedSearch, selectedStatuses, isArchivedView],
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchMessages(1, pageSize, debouncedSearch, selectedStatuses);
  }, [debouncedSearch, selectedStatuses, pageSize, fetchMessages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchMessages(newPage, pageSize, debouncedSearch, selectedStatuses);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchMessages(1, newSize, debouncedSearch, selectedStatuses);
  };

  // Toggle single status in multi-select checkbox filter
  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Clear all status filters
  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  // Open Message Detail & mark as read automatically if unread
  const handleOpenMessage = async (msg: ContactMessageData) => {
    setSelectedMessage(msg);
    setAdminNotes(msg.notes || "");

    if (msg.status === "unread") {
      updateMessageStatus(msg._id, "read", false);
    }
  };

  // Update Message Status (unread, read, replied, archived)
  const updateMessageStatus = async (
    id: string,
    newStatus: "unread" | "read" | "replied" | "archived",
    showToast = true,
  ) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/contact/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (showToast) {
          toast.success(
            newStatus === "archived"
              ? "Moved to Archive"
              : `Marked as ${newStatus}`,
          );
        }

        // If we archived a message from active inbox or restored from archive, refresh the list
        if (
          (!isArchivedView && newStatus === "archived") ||
          (isArchivedView && newStatus !== "archived")
        ) {
          setMessages((prev) => prev.filter((m) => m._id !== id));
          setTotalItems((t) => Math.max(0, t - 1));
          if (newStatus === "archived") {
            setArchivedCount((c) => c + 1);
          } else {
            setArchivedCount((c) => Math.max(0, c - 1));
          }
          if (selectedMessage && selectedMessage._id === id) {
            setSelectedMessage(null);
          }
        } else {
          setMessages((prev) =>
            prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m)),
          );
          if (selectedMessage && selectedMessage._id === id) {
            setSelectedMessage({ ...selectedMessage, status: newStatus });
          }
        }

        if (newStatus === "unread") {
          setUnreadCount((c) => c + 1);
        } else {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Internal Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsSavingNotes(true);
    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/contact/${selectedMessage._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: adminNotes }),
        },
      );

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Notes saved");
        setSelectedMessage({ ...selectedMessage, notes: adminNotes });
        setMessages((prev) =>
          prev.map((m) =>
            m._id === selectedMessage._id ? { ...m, notes: adminNotes } : m,
          ),
        );
      } else {
        toast.error(json.message || "Failed to save notes");
      }
    } catch {
      toast.error("Network error saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Permanently Delete Message
  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/contact/${messageToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Message permanently deleted");
        if (selectedMessage?._id === messageToDelete._id) {
          setSelectedMessage(null);
        }
        setMessageToDelete(null);
        fetchMessages(currentPage, pageSize, debouncedSearch, selectedStatuses);
      } else {
        toast.error(json.message || "Failed to delete message");
      }
    } catch {
      toast.error("Network error deleting message");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Status Badge
  const getStatusBadge = (status: ContactMessageData["status"]) => {
    switch (status) {
      case "unread":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unread
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Read
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Replied
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            📦 Archived
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Page Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-zinc-950 font-heading">
              {isArchivedView
                ? "Archived Contact Inquiries"
                : "Contact Inquiries & Messages"}
            </h2>
            {!isArchivedView && unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full shadow-2xs animate-pulse">
                {unreadCount} New
              </span>
            )}
            {isArchivedView && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                {totalItems} Archived
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isArchivedView
              ? "Review archived messages or delete them permanently from the database."
              : "Review and respond to messages submitted by recruiters, clients, and collaborators."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Navigate between Active Inbox and Archived Page */}
          {isArchivedView ? (
            <Link
              href="/admin/contact"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              <span>Back to Inbox</span>
            </Link>
          ) : (
            <Link
              href="/admin/contact/archived"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              <span>Archived ({archivedCount})</span>
            </Link>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() =>
              fetchMessages(
                currentPage,
                pageSize,
                debouncedSearch,
                selectedStatuses,
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-zinc-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar with Interactive Popover */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, or keyword..."
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

        {/* Filter Trigger with Checkbox Dropdown (Only for Active Inbox) */}
        {!isArchivedView && (
          <div
            className="relative self-end sm:self-auto"
            ref={filterDropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none ${
                selectedStatuses.length > 0
                  ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/80 shadow-xs ring-2 ring-blue-100"
                  : isFilterDropdownOpen
                    ? "bg-zinc-100 text-zinc-900 border-zinc-300"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {/* Funnel / Filter Icon */}
              <svg
                className={`w-4 h-4 transition-colors ${
                  selectedStatuses.length > 0
                    ? "text-blue-600"
                    : "text-zinc-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              <span>Filter Status</span>

              {/* Absolute Badge Count - Stays firmly pinned at the top-right corner without shifting button text */}
              {selectedStatuses.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in-75 duration-150">
                  {selectedStatuses.length}
                </span>
              )}
            </button>

            {/* Checkbox Popover Menu */}
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 p-3 rounded-2xl bg-white border border-zinc-200 shadow-xl z-20 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-900 font-heading">
                    Filter by Status
                  </span>
                  {selectedStatuses.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {AVAILABLE_STATUSES.map((status) => {
                    const isChecked = selectedStatuses.includes(status.key);
                    return (
                      <label
                        key={status.key}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-zinc-50 text-zinc-950 font-semibold"
                            : "text-zinc-700 hover:bg-zinc-50/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStatusFilter(status.key)}
                          className="w-4 h-4 rounded text-blue-600 border-zinc-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${status.dotColor}`}
                        />
                        <span>{status.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Messages Table Container with Inner Pagination */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Phone Number</th>
              <th className="py-3.5 px-4">Reason / Topic</th>
              <th className="py-3.5 px-4 min-w-[200px] max-w-xs">
                Message Snippet
              </th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={8} rows={5} />
          ) : messages.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">
                      {isArchivedView ? "📦" : "📭"}
                    </span>
                    <p className="font-semibold text-zinc-700">
                      {isArchivedView
                        ? "No archived inquiries found"
                        : "No contact inquiries found"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isArchivedView
                        ? "Messages you archive will be stored here for future reference."
                        : "Messages submitted through your portfolio contact form will appear here."}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-zinc-100">
              {messages.map((msg) => {
                const isUnread = msg.status === "unread";
                const formattedDate = new Date(
                  msg.createdAt,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const phoneText =
                  msg.fullPhoneNumber ||
                  (msg.phoneNumber
                    ? `${msg.countryCode || ""}${msg.phoneNumber}`
                    : "");

                return (
                  <tr
                    key={msg._id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isUnread ? "bg-amber-50/20 font-medium" : ""
                    }`}
                  >
                    {/* Sender */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                        )}
                        <span className="font-bold text-zinc-950 font-heading text-sm">
                          {msg.name}
                        </span>
                      </div>
                    </td>

                    {/* Email with Copy Button */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="inline-flex items-center gap-1.5 group max-w-[200px]">
                        <span
                          className="text-blue-600 font-medium truncate"
                          title={msg.email}
                        >
                          {msg.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.email);
                            toast.success("Email copied to clipboard!");
                          }}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer flex-shrink-0"
                          title="Copy email"
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
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>

                    {/* Phone Number with Copy Button */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {phoneText ? (
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-zinc-800 font-semibold">
                            {phoneText}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(phoneText);
                              toast.success(
                                "Phone number copied to clipboard!",
                              );
                            }}
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer flex-shrink-0"
                            title="Copy phone number"
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
                                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Not provided
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700">
                        {msg.reason || "General"}
                      </span>
                    </td>

                    {/* Message Snippet (Cleanly clamped with title tooltip for long text) */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <p
                        className="line-clamp-2 text-xs leading-relaxed"
                        title={msg.message}
                      >
                        {msg.message}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(msg.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                      {formattedDate}
                    </td>

                    {/* Actions: View (Eye Icon), Quick Reply, Archive, Delete */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. View Details Icon (Eye Icon) */}
                        <button
                          type="button"
                          onClick={() => handleOpenMessage(msg)}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                          title="View Inquiry Details"
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
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>

                        {/* 2. Quick Reply (mailto) */}
                        <a
                          href={`mailto:${msg.email}?subject=Re: Your Inquiry on Vijay's Portfolio (${msg.reason})`}
                          onClick={() =>
                            updateMessageStatus(msg._id, "replied", false)
                          }
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                          title="Reply via Email"
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </a>

                        {/* 3. Archive or Restore Action */}
                        {!isArchivedView ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateMessageStatus(msg._id, "archived")
                            }
                            className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer"
                            title="Move to Archive"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                              />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateMessageStatus(msg._id, "read")}
                            className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
                            title="Restore to Inbox"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                              />
                            </svg>
                          </button>
                        )}

                        {/* 4. Delete Button (Trash Icon) */}
                        {/* <button
                          type="button"
                          onClick={() => setMessageToDelete(msg)}
                          className="w-7 h-7 rounded-full border border-red-300 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Delete message permanently"
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
                        </button> */}
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

      {/* 4. Message Detail Modal */}
      <Modal
        isOpen={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        title="Inquiry Details"
        maxWidth="lg"
      >
        {selectedMessage && (
          <div className="space-y-6 text-xs">
            {/* Sender Meta Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-zinc-950 font-heading">
                    {selectedMessage.name}
                  </h4>
                  <p className="text-xs text-blue-600 font-medium">
                    {selectedMessage.email}
                  </p>
                </div>
                <div>{getStatusBadge(selectedMessage.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 text-[11px] text-slate-500">
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Phone:
                  </span>
                  <span>
                    {selectedMessage.fullPhoneNumber ||
                      (selectedMessage.phoneNumber
                        ? `${selectedMessage.countryCode || ""}${selectedMessage.phoneNumber}`
                        : "Not provided")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Topic / Reason:
                  </span>
                  <span>{selectedMessage.reason || "General"}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Received:
                  </span>
                  <span>
                    {new Date(selectedMessage.createdAt).toLocaleString(
                      undefined,
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="font-semibold text-zinc-900 block mb-1.5">
                Full Message
              </label>
              <div className="p-4 rounded-xl bg-white border border-zinc-200 text-slate-700 leading-relaxed whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                {selectedMessage.message}
              </div>
            </div>

            {/* Admin Status Controls */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <label className="font-semibold text-zinc-900 block">
                Update Status
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {(["unread", "read", "replied", "archived"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        updateMessageStatus(selectedMessage._id, s)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        selectedMessage.status === s
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {s === "archived" ? "📦 Archive" : s}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-900">
                  Private Admin Notes (Internal Only)
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {isSavingNotes ? "Saving..." : "Save Note"}
                </button>
              </div>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Replied via email on Oct 20, scheduled intro call..."
                className="form-input bg-white text-xs w-full"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  setMessageToDelete(selectedMessage);
                  setSelectedMessage(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: Your Inquiry on Vijay's Portfolio (${selectedMessage.reason})`}
                  onClick={() =>
                    updateMessageStatus(selectedMessage._id, "replied", false)
                  }
                  className="btn-primary !text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Delete Confirmation Dialog (Permanent Deletion) */}
      <ConfirmDialog
        isOpen={Boolean(messageToDelete)}
        title="Delete Contact Inquiry Permanently"
        description={`Are you sure you want to permanently delete the inquiry from "${messageToDelete?.name}" (${messageToDelete?.email})? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Permanently"}
        cancelText="Keep Message"
        onConfirm={handleConfirmDelete}
        onClose={() => setMessageToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
