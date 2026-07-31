"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ISOLATION: Hide the Data Console sidebar/header on login, portal, AND all roster pages
  if (
    pathname === "/" ||
    pathname === "/login" || 
    pathname === "/portal" || 
    pathname?.startsWith("/roster")
  ) {
    return <main className="flex-1 w-full h-screen">{children}</main>;
  }

  // Otherwise, render the standard Data Console layout
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header setIsMobileOpen={setIsMobileOpen} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}