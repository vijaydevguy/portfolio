"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminProjectOptionsManager from "../../components/admin/AdminProjectOptionsManager";

interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "user";
}

export default function AdminProjectOptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (!token) {
      router.replace("/admin");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // fallback
      }
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading project options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex relative overflow-hidden font-sans">
      {/* Unified Admin Sidebar */}
      <AdminSidebar
        user={user}
        activeMenu="project-options"
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden w-full bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="text-sm font-bold text-zinc-950 font-heading">
            Project Taxonomy
          </span>
          <div className="w-8" />
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto flex-1 pb-16">
          <AdminProjectOptionsManager />
        </main>
      </div>
    </div>
  );
}
