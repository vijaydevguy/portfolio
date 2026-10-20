"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";
import {
  LuLayers,
  LuMail,
  LuUsers,
  LuChevronLeft,
  LuArrowRight,
  LuLogOut,
  LuX,
} from "react-icons/lu";

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

      {/* 2. Responsive Sidebar */}
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
                <LuArrowRight className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
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
                <LuChevronLeft className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Close */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              >
                <LuX className="w-5 h-5" />
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
              <LuLayers className="w-5 h-5 flex-shrink-0" />
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
              <LuLayers className="w-5 h-5 flex-shrink-0" />
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
            <LuMail className="w-5 h-5 flex-shrink-0" />
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
                <LuUsers className="w-5 h-5 flex-shrink-0" />
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
                <LuUsers className="w-5 h-5 flex-shrink-0" />
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
            <LuLogOut className="w-4 h-4 flex-shrink-0" />
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
