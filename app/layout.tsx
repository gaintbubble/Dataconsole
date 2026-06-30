import type { Metadata } from "next";
import "./globals.css";
// Import our new smart sidebar component
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "DataConsole",
  description: "Modern Excel Consolidator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-white font-sans text-xs antialiased text-slate-800">
        
        {/* --- SMART SIDEBAR WITH ACTIVE STATES --- */}
        <Sidebar />

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* RAZOR-THIN HEADER */}
          <header className="h-8 bg-slate-100 border-b border-slate-300 flex items-center justify-between px-4 z-10 shadow-sm shrink-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-blue-950 tracking-tight">Workspace</h2>
              <span className="text-slate-400 text-[10px]">|</span>
              <span className="text-[10px] text-slate-500">Data Consolidation Platform</span>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-auto bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}