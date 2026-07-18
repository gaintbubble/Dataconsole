"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If the user is on the login page, render ONLY the page content (no sidebar/header)
  if (pathname === "/login") {
    return <main className="flex-1 w-full h-screen">{children}</main>;
  }

  // Otherwise, render the full dashboard layout
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Sidebar Fixed */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header Fixed */}
        <Header />
        
        {/* Page Content (Scrollable) */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}