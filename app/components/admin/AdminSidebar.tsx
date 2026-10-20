"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: "admin" | "user";
}

interface AdminSidebarProps {
  user: UserProfile | null;
  activeMenu?: "sections" | "contact" | "users";
  onNavigateSections?: (tab?: string) => void;
  onNavigateUsers?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  user,
  activeMenu,
  onNavigateSections,
  onNavigateUsers,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Derive active menu from pathname if not explicitly passed
  const currentMenu =
    activeMenu ||
    (pathname?.startsWith("/admin/contact")
      ? "contact"
      : pathname?.startsWith("/admin/edit")
        ? "sections"
        : "sections");

  const executeLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin";
  };

  return (
    <>
      {/* 1. Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 2. Responsive Sidebar (Matching exact layout, collapse animation, and styling) */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen bg-white border-r border-zinc-200/90 z-50 flex flex-col justify-between transition-all duration-300 ease-in-out select-none flex-shrink-0 ${
          isMobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-[76px]" : "lg:w-64"}`}
      >
        {/* Sidebar Top: Logo/Brand & Toggle Button */}
        <div className="p-3.5 border-b border-zinc-100 min-h-[64px] flex items-center">
          {isCollapsed ? (
            /* COLLAPSED VIEW: Centered expand button */
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                title="Expand Sidebar"
                className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-blue-50 text-zinc-600 hover:text-[#1D4ED8] flex items-center justify-center transition-all cursor-pointer shadow-xs group"
              >
                <svg
                  className="w-5 h-5 transform group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          ) : (
            /* EXPANDED VIEW: Brand Icon + Title + Collapse Chevron Button */
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                  V
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-zinc-950 font-heading truncate">
                    Admin Panel
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider truncate">
                    {user?.role === "admin" ? "Super Admin" : "User"}
                  </span>
                </div>
              </div>

              {/* Desktop Collapse Trigger */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Collapse Sidebar"
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Mobile Drawer Close */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {/* Option 1: Edit Sections */}
          {onNavigateSections ? (
            <button
              type="button"
              onClick={() => {
                onNavigateSections();
                setIsMobileOpen(false);
              }}
              title={isCollapsed ? "Edit Sections" : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentMenu === "sections"
                  ? "bg-blue-50 text-[#1D4ED8] shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {!isCollapsed && <span className="truncate">Edit Sections</span>}
            </button>
          ) : (
            <Link
              href="/admin/edit?view=sections"
              title={isCollapsed ? "Edit Sections" : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentMenu === "sections"
                  ? "bg-blue-50 text-[#1D4ED8] shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {!isCollapsed && <span className="truncate">Edit Sections</span>}
            </Link>
          )}

          {/* Option 2: Contact Inquiries (Dedicated Standalone Page) */}
          <Link
            href="/admin/contact"
            title={isCollapsed ? "Contact Inquiries" : undefined}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              currentMenu === "contact"
                ? "bg-blue-50 text-[#1D4ED8] shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {!isCollapsed && <span className="truncate">Contact Inquiries</span>}
          </Link>

          {/* Option 3: Users Management (Admin Only) */}
          {user?.role === "admin" && (
            onNavigateUsers ? (
              <button
                type="button"
                onClick={() => {
                  onNavigateUsers();
                  setIsMobileOpen(false);
                }}
                title={isCollapsed ? "Users Management" : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  currentMenu === "users"
                    ? "bg-blue-50 text-[#1D4ED8] shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {!isCollapsed && <span className="truncate">Users & Roles</span>}
              </button>
            ) : (
              <Link
                href="/admin/edit?view=users"
                title={isCollapsed ? "Users Management" : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentMenu === "users"
                    ? "bg-blue-50 text-[#1D4ED8] shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {!isCollapsed && <span className="truncate">Users & Roles</span>}
              </Link>
            )
          )}
        </nav>

        {/* Sidebar Bottom: User Card & Modern Logout Button */}
        <div className="p-3 border-t border-zinc-100 space-y-2">
          {!isCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs">
              <p className="font-semibold text-zinc-900 truncate">{user?.name || "Vijay Kumar"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            title={isCollapsed ? "Sign Out" : undefined}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 border border-rose-200/70 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
            </svg>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Admin?"
        description="Are you sure you want to end your current session? You will need to log in again to manage your portfolio."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={executeLogout}
        onClose={() => setShowLogoutConfirm(false)}
        isDestructive={true}
      />
    </>
  );
}
