"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CONFIG } from "../../common";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import TableSkeleton from "../../components/ui/TableSkeleton";
import Pagination from "../../components/ui/Pagination";
import MediaUploader from "../../components/ui/MediaUploader";
import AdminProjectsManager from "../../components/admin/AdminProjectsManager";
import AdminSkillsManager from "../../components/admin/AdminSkillsManager";
import AdminExperienceManager from "../../components/admin/AdminExperienceManager";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useDebounce } from "../../hooks/useDebounce";
import { LuTrash2, LuRefreshCw } from "react-icons/lu";

interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
  isFirstTime: boolean;
  createdAt?: string;
}

// 2 primary navigation options in the sidebar
type SidebarMenu = "sections" | "users";

// Sub-tabs under the "Edit Sections" page
type ContentTab = "hero" | "experience" | "projects" | "skills";

const CONTENT_TABS: { key: ContentTab; label: string; icon: string }[] = [
  { key: "hero", label: "Hero Section", icon: "👤" },
  { key: "experience", label: "Experience & Education", icon: "💼" },
  { key: "projects", label: "Selected Projects", icon: "🚀" },
  { key: "skills", label: "Skills & Tech", icon: "⚡" },
];

export default function AdminEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading admin workspace...</p>
          </div>
        </div>
      }
    >
      <AdminEditContent />
    </Suspense>
  );
}

function AdminEditContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from search params if present
  const initialMenu = (searchParams.get("view") === "users" ? "users" : "sections") as SidebarMenu;
  const initialTabParam = searchParams.get("tab") as ContentTab;
  const initialTab = CONTENT_TABS.some((t) => t.key === initialTabParam) ? initialTabParam : "hero";

  const [activeMenu, setActiveMenu] = useState<SidebarMenu>(initialMenu);
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab);

  // Sync state if URL searchParams change (e.g. back/forward navigation)
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "users" || viewParam === "sections") {
      setActiveMenu(viewParam as SidebarMenu);
    }
    const tabParam = searchParams.get("tab") as ContentTab;
    if (tabParam && CONTENT_TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Helper to update URL query params when switching view or tab
  const updateNavigation = (newMenu: SidebarMenu, newTab?: ContentTab) => {
    setActiveMenu(newMenu);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newMenu);
    if (newMenu === "sections") {
      const tabToSet = newTab || activeTab;
      if (newTab) setActiveTab(newTab);
      params.set("tab", tabToSet);
    } else {
      params.delete("tab");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Users management state (Admin only)
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedUserSearch = useDebounce(searchQuery, 400);

  // Auto-search users when debounced search query changes
  useEffect(() => {
    if (user?.role === "admin" && activeMenu === "users") {
      fetchUsersList(1, pageSize, debouncedUserSearch);
    }
  }, [debouncedUserSearch]);

  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; email: string } | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editBlocked, setEditBlocked] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // Logout confirmation dialog state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Desktop sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile / Tablet overlay drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Authenticate token on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    fetch(`${CONFIG.BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("admin_user", JSON.stringify(data.user));
          if (data.user.role === "admin") {
            fetchUsersList(1, pageSize, "", token);
          }
        } else {
          throw new Error("Invalid session");
        }
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin";
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Hero section form state with full default prefill
  const [loadingHero, setLoadingHero] = useState(true);
  const [heroForm, setHeroForm] = useState({
    logoText: "Vijay Kumar",
    logoUrl: "https://res.cloudinary.com/dtgn3hnzh/image/upload/v1773030225/portfolio_app/logo_black.webp",
    titlePrefix: "Software",
    titleHighlight: "Developer",
    subtitle: "Crafting scalable, high-performance web applications and intuitive digital experiences.",
    heroImageUrl: "https://res.cloudinary.com/dtgn3hnzh/image/upload/v1792249847/hero_img_oharzk",
    resumes: [
      {
        label: "Download Resume",
        url: "https://drive.google.com/uc?export=download&id=1QfIBC0J_QRX4MRoycDwEdD3xBt2kKSpE",
        isPrimary: true,
      },
    ],
    ctaContactText: "Get in Touch",
    ctaContactHref: "#contact",
    isVisible: true,
  });

  useEffect(() => {
    // Fetch existing Hero and Navbar Section data for editing
    setLoadingHero(true);
    fetch(`${CONFIG.BACKEND_URL}/api/sections/hero`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setHeroForm({
            logoText: json.data.logoText || "Vijay Kumar",
            logoUrl: json.data.logoUrl || "",
            titlePrefix: json.data.titlePrefix || "Software",
            titleHighlight: json.data.titleHighlight || "Developer",
            subtitle: json.data.subtitle || "",
            heroImageUrl: json.data.heroImageUrl || "",
            resumes: json.data.resumes && json.data.resumes.length > 0
              ? json.data.resumes
              : [{ label: "Download Resume", url: "", isPrimary: true }],
            ctaContactText: json.data.ctaContactText || "Get in Touch",
            ctaContactHref: json.data.ctaContactHref || "#contact",
            isVisible: json.data.isVisible !== false,
          });
        }
      })
      .catch((err) => console.error("Error loading hero section data:", err))
      .finally(() => setLoadingHero(false));
  }, []);
  const [savingHero, setSavingHero] = useState(false);
  const [heroSaveMsg, setHeroSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setSavingHero(true);
    setHeroSaveMsg(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/sections/hero`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(heroForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update hero section");
      }
      setHeroSaveMsg({ type: "success", text: "Hero & Navbar settings saved successfully!" });
      setTimeout(() => setHeroSaveMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setHeroSaveMsg({ type: "error", text: error.message || "Failed to save settings." });
    } finally {
      setSavingHero(false);
    }
  };

  const fetchUsersList = async (
    targetPage = currentPage,
    targetLimit = pageSize,
    targetSearch = searchQuery,
    authToken?: string
  ) => {
    const token = authToken || localStorage.getItem("admin_token");
    if (!token) return;
    setLoadingUsers(true);
    try {
      const url = new URL(`${CONFIG.BACKEND_URL}/api/auth/users`);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(targetLimit));
      if (targetSearch.trim()) {
        url.searchParams.set("search", targetSearch.trim());
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalUsers(data.pagination.totalUsers);
        }
      }
    } catch (err) {
      console.error("Error fetching users list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/auth/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editRole,
          isBlocked: editBlocked,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      setUserActionMsg("User updated successfully!");
      setEditingUser(null);
      fetchUsersList();
      setTimeout(() => setUserActionMsg(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const executeDeleteUser = async () => {
    if (!deletingUser) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/auth/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }
      setUserActionMsg("User deleted successfully!");
      setDeletingUser(null);
      fetchUsersList();
      setTimeout(() => setUserActionMsg(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const executeLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin";
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex relative overflow-hidden font-sans">
      {/* 1. Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Unified Responsive Admin Sidebar */}
      <AdminSidebar
        user={user}
        activeMenu={activeMenu === "users" ? "users" : "sections"}
        onNavigateSections={(tab) => updateNavigation("sections", tab as any)}
        onNavigateUsers={() => updateNavigation("users")}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* 3. Main Workspace Area: Independently scrollable right side */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="lg:hidden w-full bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-zinc-950 font-heading">
            {activeMenu === "sections" ? "Content Sections" : "Users Management"}
          </span>
          <div className="w-8" />
        </div>

        {/* Dynamic Canvas Container - Full Available Width Centered */}
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto flex-1 pb-16">
          {/* OPTION 1: EDIT SECTIONS (With Horizontal Tabs for all sections) */}
          {activeMenu === "sections" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-950 font-heading">
                    Portfolio Content Sections
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a section tab below to update headings, content, visibility, and media.
                  </p>
                </div>
              </div>

              {/* Horizontal Tabs for Scalable Section Expansion */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-200/60 border border-zinc-200 w-fit font-heading">
                {CONTENT_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => updateNavigation("sections", tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-zinc-950 shadow-xs"
                          : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT: HERO SECTION */}
              {activeTab === "hero" && (
                loadingHero ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-8 animate-pulse">
                    {/* Header Skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                      <div className="space-y-2">
                        <div className="h-6 w-64 bg-zinc-200 rounded-lg" />
                        <div className="h-3.5 w-96 max-w-full bg-zinc-100 rounded-md" />
                      </div>
                      <div className="h-9 w-36 bg-zinc-100 rounded-xl" />
                    </div>

                    {/* Section 1: Logo & Brand */}
                    <div className="space-y-3">
                      <div className="h-4 w-40 bg-zinc-200 rounded" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-3.5 w-24 bg-zinc-200 rounded" />
                          <div className="h-10 bg-zinc-100 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3.5 w-24 bg-zinc-200 rounded" />
                          <div className="h-10 bg-zinc-100 rounded-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Headline & Media */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <div className="h-4 w-44 bg-zinc-200 rounded" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-3.5 w-20 bg-zinc-200 rounded" />
                          <div className="h-10 bg-zinc-100 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3.5 w-28 bg-zinc-200 rounded" />
                          <div className="h-10 bg-zinc-100 rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3.5 w-20 bg-zinc-200 rounded" />
                        <div className="h-20 bg-zinc-100 rounded-xl" />
                      </div>
                      <div className="h-36 bg-zinc-100 rounded-xl" />
                    </div>

                    {/* Section 3: Resume Download */}
                    <div className="space-y-3 pt-4 border-t border-zinc-100">
                      <div className="h-4 w-40 bg-zinc-200 rounded" />
                      <div className="h-28 bg-zinc-50 border border-zinc-200/80 rounded-xl" />
                    </div>

                    {/* Bottom Save Skeleton */}
                    <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
                      <div className="h-4 w-72 bg-zinc-100 rounded" />
                      <div className="h-11 w-32 bg-zinc-200 rounded-xl" />
                    </div>
                  </div>
                ) : (
                <form onSubmit={handleSaveHero} className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950 font-heading">
                        Hero Section & Navbar Configuration
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customize your brand logo, primary tagline, hero description, and resume download links.
                      </p>
                    </div>

                    {/* Section Visibility Switch */}
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium self-start sm:self-auto">
                      <span className="text-zinc-700 font-semibold">Section Visibility:</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={heroForm.isVisible}
                        onClick={() => setHeroForm((prev) => ({ ...prev, isVisible: !prev.isVisible }))}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          heroForm.isVisible ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            heroForm.isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {heroSaveMsg && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-semibold border ${
                        heroSaveMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {heroSaveMsg.text}
                    </div>
                  )}

                  {/* 1. Navbar Brand Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider text-slate-400">
                      1. Navbar Brand Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                      <div>
                        <label className="form-label font-semibold text-zinc-900">Navbar Brand Text</label>
                        <input
                          type="text"
                          value={heroForm.logoText}
                          onChange={(e) => setHeroForm({ ...heroForm, logoText: e.target.value })}
                          placeholder="Vijay Kumar"
                          className="form-input bg-white"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Used as image alt-text and accessibility label</p>
                      </div>

                      {/* Brand Logo Media Uploader (User Folder: user_<id>/navbar/logo) */}
                      <MediaUploader
                        label="Navbar Brand Logo"
                        section="navbar"
                        category="logo"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        currentValue={heroForm.logoUrl}
                        onSelect={(val) => setHeroForm({ ...heroForm, logoUrl: val })}
                        helperText="Upload transparent PNG, SVG, or WebP. Max 3 logos kept in storage."
                      />
                    </div>
                  </div>

                  {/* 2. Hero Heading & Subtitle */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider text-slate-400">
                      2. Hero Headline & Media
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="form-label font-semibold text-zinc-900">Headline Prefix</label>
                        <input
                          type="text"
                          value={heroForm.titlePrefix}
                          onChange={(e) => setHeroForm({ ...heroForm, titlePrefix: e.target.value })}
                          placeholder="Software"
                          className="form-input bg-white"
                        />
                      </div>
                      <div>
                        <label className="form-label font-semibold text-zinc-900">Headline Highlight (Blue Accent)</label>
                        <input
                          type="text"
                          value={heroForm.titleHighlight}
                          onChange={(e) => setHeroForm({ ...heroForm, titleHighlight: e.target.value })}
                          placeholder="Developer"
                          className="form-input bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="form-label font-semibold text-zinc-900">Hero Subtitle</label>
                      <textarea
                        rows={3}
                        value={heroForm.subtitle}
                        onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                        placeholder="Crafting scalable, high-performance web applications..."
                        className="form-input resize-none bg-white"
                      />
                    </div>

                    {/* Hero Illustration Media Uploader (User Folder: user_<id>/hero/illustration) */}
                    <MediaUploader
                      label="Hero Illustration Image"
                      section="hero"
                      category="illustration"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      currentValue={heroForm.heroImageUrl}
                      onSelect={(val) => setHeroForm({ ...heroForm, heroImageUrl: val })}
                      helperText="Upload vector graphic or transparent illustration. Max 3 illustrations kept in storage."
                    />
                  </div>

                  {/* 3. Resume Links (Max 3 with PDF upload capability) */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider text-slate-400">
                          3. Resume Downloads (Max 3 Allowed)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Upload PDF resumes directly or enter external link. PDF link preview is generated automatically.
                        </p>
                      </div>

                      {heroForm.resumes.length < 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setHeroForm((prev) => ({
                              ...prev,
                              resumes: [
                                ...prev.resumes,
                                { label: `Resume ${prev.resumes.length + 1}`, url: "", isPrimary: false },
                              ],
                            }))
                          }
                          className="btn-secondary !text-[11px] !py-1.5 !px-3 !rounded-lg"
                        >
                          + Add Resume
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {heroForm.resumes.map((resume, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-700">Resume Slot #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = heroForm.resumes.map((r, i) => ({
                                    ...r,
                                    isPrimary: i === idx,
                                  }));
                                  setHeroForm({ ...heroForm, resumes: updated });
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                                  resume.isPrimary
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900"
                                }`}
                              >
                                {resume.isPrimary ? "Primary" : "Set Primary"}
                              </button>

                              {heroForm.resumes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = heroForm.resumes.filter((_, i) => i !== idx);
                                      setHeroForm({ ...heroForm, resumes: updated });
                                    }}
                                    className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Remove Resume"
                                  >
                                    <LuTrash2 className="w-4 h-4" />
                                  </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="form-label text-[11px]">Button Label</label>
                              <input
                                type="text"
                                value={resume.label}
                                onChange={(e) => {
                                  const updated = [...heroForm.resumes];
                                  updated[idx].label = e.target.value;
                                  setHeroForm({ ...heroForm, resumes: updated });
                                }}
                                placeholder="Download Resume"
                                className="form-input bg-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <MediaUploader
                                label="Resume Document (Google Drive / Direct PDF Link)"
                                section="resume"
                                category={`slot_${idx + 1}`}
                                accept="application/pdf"
                                isPdf={true}
                                hideDropzone={true}
                                allowManualInput={true}
                                currentValue={resume.url}
                                onSelect={(val) => {
                                  const updated = [...heroForm.resumes];
                                  updated[idx].url = val;
                                  setHeroForm({ ...heroForm, resumes: updated });
                                }}
                                helperText="Paste your public Google Drive download link or direct PDF URL."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Secondary CTA */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider text-slate-400">
                      4. Contact CTA Button
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="form-label font-semibold text-zinc-900">Button Text</label>
                        <input
                          type="text"
                          value={heroForm.ctaContactText}
                          onChange={(e) => setHeroForm({ ...heroForm, ctaContactText: e.target.value })}
                          placeholder="Get in Touch"
                          className="form-input bg-white"
                        />
                      </div>
                      <div>
                        <label className="form-label font-semibold text-zinc-900">Button Target (Anchor or URL)</label>
                        <input
                          type="text"
                          value={heroForm.ctaContactHref}
                          onChange={(e) => setHeroForm({ ...heroForm, ctaContactHref: e.target.value })}
                          placeholder="#contact"
                          className="form-input bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Bottom Save Changes Action Button */}
                  <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Changes will reflect immediately on your portfolio website and Navbar.
                    </p>

                    <button
                      type="submit"
                      disabled={savingHero}
                      className="btn-primary !text-sm !py-3 !px-7 !rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 cursor-pointer"
                    >
                      {savingHero ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
                )
              )}

              {/* TAB CONTENT: EXPERIENCE */}
              {activeTab === "experience" && <AdminExperienceManager />}

              {/* TAB CONTENT: PROJECTS */}
              {activeTab === "projects" && <AdminProjectsManager />}

              {/* TAB CONTENT: SKILLS */}
              {activeTab === "skills" && <AdminSkillsManager />}
            </div>
          )}

          {/* OPTION 2: USERS MANAGEMENT (Super Admin Only) */}
          {activeMenu === "users" && user?.role === "admin" && (
            <div className="space-y-6">
              {/* Header with Search and Refresh */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-950 font-heading">
                    Registered Users & Roles
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    View all platform accounts (including your super-admin account), assign roles, and manage access.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Input Field */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3.5 py-2 pl-9 pr-8 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-52 sm:w-64"
                    />
                    <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

                  <button
                    type="button"
                    onClick={() => fetchUsersList(currentPage, pageSize, debouncedUserSearch)}
                    className="btn-secondary !text-xs !py-2 !px-3.5 !rounded-xl"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Success / Alert Banner */}
              {userActionMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {userActionMsg}
                </div>
              )}

              {/* Users Table Card */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3.5 px-4 sm:px-6">User Profile</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Account Status</th>
                        <th className="py-3.5 px-4">Registered On</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>

                    {/* Loading State: Powered by react-loading-skeleton */}
                    {loadingUsers ? (
                      <TableSkeleton rows={pageSize > 5 ? 6 : pageSize} />
                    ) : usersList.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-xs text-slate-500">
                            No users found matching your query.
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody className="divide-y divide-zinc-100">
                        {usersList.map((u) => {
                          const isSelf = u.id === user.id;
                          return (
                            <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                              {/* User Info */}
                              <td className="py-4 px-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-2xs">
                                    {u.name ? u.name[0] : u.email[0]}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-zinc-950 flex items-center gap-1.5 text-sm">
                                      {u.name || "No Name"}
                                      {isSelf && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                          You
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">{u.email}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-4 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                                    u.role === "admin"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                                  }`}
                                >
                                  {u.role === "admin" ? "Super Admin" : "User"}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-4 px-4">
                                {u.isBlocked ? (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px] uppercase tracking-wider">
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px] uppercase tracking-wider">
                                    Active
                                  </span>
                                )}
                              </td>

                              {/* Registered Date */}
                              <td className="py-4 px-4 text-slate-500 font-medium">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                              </td>

                              {/* Larger Icon Action Buttons */}
                              <td className="py-4 px-4 sm:px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* View Button */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingUser(u)}
                                    title="View Profile Details"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                  >
                                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>View</span>
                                  </button>

                                  {/* Edit Button: Visible for admin to manage other users or roles */}
                                  {user?.role === "admin" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditRole(u.role);
                                        setEditBlocked(u.isBlocked);
                                      }}
                                      title="Edit User Role & Status"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-[#1D4ED8] text-xs font-semibold border border-blue-100 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <svg className="w-4 h-4 text-[#1D4ED8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  {/* Delete Button (Disabled on Self) */}
                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingUser({ id: u.id, email: u.email })}
                                      title="Delete User Account"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-semibold border border-rose-100 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </table>
                </div>

                {/* Reusable Pagination Controls */}
                {!loadingUsers && usersList.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalUsers}
                    pageSize={pageSize}
                    onPageChange={(page) => fetchUsersList(page, pageSize, searchQuery)}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      fetchUsersList(1, size, searchQuery);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* VIEW USER MODAL (DRY Component) */}
          <Modal
            isOpen={Boolean(viewingUser)}
            onClose={() => setViewingUser(null)}
            title="User Profile Details"
            maxWidth="md"
          >
            {viewingUser && (
              <div className="space-y-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Full Name:</span>
                    <span className="font-semibold text-zinc-900">{viewingUser.name || "None provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email Address:</span>
                    <span className="font-semibold text-zinc-900">{viewingUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">System Role:</span>
                    <span className="font-semibold text-zinc-900 capitalize">{viewingUser.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Access Status:</span>
                    <span className={viewingUser.isBlocked ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                      {viewingUser.isBlocked ? "Account Blocked / Suspended" : "Account Active"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Joined:</span>
                    <span className="text-zinc-700">
                      {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingUser(null)}
                    className="btn-secondary !text-xs !py-2 !px-4 !rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* EDIT USER MODAL (DRY Component) */}
          <Modal
            isOpen={Boolean(editingUser)}
            onClose={() => setEditingUser(null)}
            title={`Edit User: ${editingUser?.email || ""}`}
            maxWidth="md"
          >
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-4 text-xs">
                  {/* Read-Only User Details Banner */}
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">User Profile:</span>
                      <span className="font-semibold text-zinc-900">{editingUser.name || "No Name Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Email:</span>
                      <span className="font-semibold text-zinc-900">{editingUser.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Registered:</span>
                      <span className="text-zinc-600">
                        {editingUser.createdAt ? new Date(editingUser.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Option 1: Role Selector */}
                  <div>
                    <label className="form-label">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "admin" | "user")}
                      className="form-input bg-white cursor-pointer"
                    >
                      <option value="admin">Super Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>

                  {/* Option 2: Block / Unblock Toggle Switch (Disabled on Self) */}
                  <div className="pt-1">
                    <label className="form-label block mb-2">Account Access Status</label>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/60">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-zinc-900 block">
                          {editBlocked ? "Account Blocked" : "Account Active"}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {editBlocked
                            ? "Login is revoked and user cannot access dashboard"
                            : "User has normal login and profile permissions"}
                        </p>
                      </div>

                      {/* Smooth Modern Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editBlocked}
                        disabled={editingUser.id === user?.id}
                        onClick={() => setEditBlocked((prev) => !prev)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                          editBlocked ? "bg-rose-600" : "bg-emerald-500"
                        }`}
                      >
                        <span className="sr-only">Toggle account block status</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            editBlocked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {editingUser.id === user?.id && (
                      <p className="text-[10px] text-amber-600 mt-1.5 font-medium">
                        You cannot block your own super-admin account.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-secondary !text-xs !py-2 !px-4 !rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !text-xs !py-2 !px-4 !rounded-xl font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </Modal>

          {/* DELETE USER CONFIRMATION DIALOG (DRY Component) */}
          <ConfirmDialog
            isOpen={Boolean(deletingUser)}
            onClose={() => setDeletingUser(null)}
            onConfirm={executeDeleteUser}
            title="Delete User Account"
            description={`Are you sure you want to permanently delete user "${deletingUser?.email}"? This action cannot be undone.`}
            confirmText="Delete Account"
            cancelText="Keep Account"
            isDestructive={true}
          />

          {/* LOGOUT CONFIRMATION DIALOG (DRY Component) */}
          <ConfirmDialog
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={executeLogout}
            title="Sign Out"
            description="Are you sure you want to logout?"
            confirmText="Logout"
            cancelText="Cancel"
            isDestructive={true}
          />
        </main>
      </div>
    </div>
  );
}
