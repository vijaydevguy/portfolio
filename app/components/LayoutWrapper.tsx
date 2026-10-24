"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";
import { PortfolioDataProvider, usePortfolioData } from "../context/PortfolioDataContext";
import LuxuryPageLoader from "./ui/LuxuryPageLoader";

function HomeLoaderGate() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { isInitialLoad } = usePortfolioData();

  if (!isHome) return null;
  return <LuxuryPageLoader isLoading={isInitialLoad} />;
}

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <AuthProvider>
      <PortfolioDataProvider>
        <HomeLoaderGate />
        <div className={isAdmin ? "w-full min-h-screen" : "pt-20 w-full"}>
          {children}
        </div>
      </PortfolioDataProvider>
    </AuthProvider>
  );
}
