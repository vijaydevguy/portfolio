"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <AuthProvider>
      <div className={isAdmin ? "w-full min-h-screen" : "pt-20 w-full"}>
        {children}
      </div>
    </AuthProvider>
  );
}
