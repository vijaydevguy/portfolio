"use client";

import { usePathname } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { AuthProvider } from "../context/AuthContext";
import { PortfolioDataProvider, usePortfolioData } from "../context/PortfolioDataContext";
import LuxuryPageLoader from "./ui/LuxuryPageLoader";

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHome = pathname === "/";
  const { isInitialLoad } = usePortfolioData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && isHome && <LuxuryPageLoader isLoading={isInitialLoad} />}
      <div className={isAdmin ? "w-full min-h-screen" : "pt-20 w-full"}>
        {children}
      </div>
    </>
  );
}

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PortfolioDataProvider>
        <Suspense fallback={<div className="pt-20 w-full">{children}</div>}>
          <LayoutContent>{children}</LayoutContent>
        </Suspense>
      </PortfolioDataProvider>
    </AuthProvider>
  );
}
