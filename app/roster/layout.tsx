"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Users, 
  Calendar, 
  Building, 
  Clock, 
  Settings, 
  LayoutDashboard, 
  ArrowLeft, 
  ShieldCheck, 
  LogOut,
  UserCog,
  Menu
} from "lucide-react";

export default function RosterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isViewMode = searchParams?.get('view') === 'true';
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Roster-specific navigation menu
  const rosterNavItems = [
    { name: "Dashboard", href: "/roster/dashboard", icon: LayoutDashboard },
    { name: "Roster Sheet", href: "/roster/sheet", icon: Calendar },
    { name: "Emp Wise Roster", href: "/roster", icon: Users },
    { name: "Public Holidays", href: "/roster/holidays", icon: Calendar },
    { name: "Staff Mapping", href: "/roster/mapping", icon: UserCog },
    { name: "Departments", href: "/roster/departments", icon: Building },
    { name: "Duty Timings", href: "/roster/timings", icon: Clock },
    { name: "Authorisations", href: "/roster/authorisation", icon: ShieldCheck },
    { name: "Settings", href: "/roster/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 print:bg-white print:h-auto print:overflow-visible">
      
      {/* MOBILE OVERLAY */}
      {isMobileOpen && !isViewMode && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden print:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ROSTER-SPECIFIC SIDEBAR */}
      {!isViewMode && (
        <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'md:w-20' : 'md:w-56'} 
          w-64 bg-slate-800 text-slate-300 flex flex-col h-full shadow-lg shrink-0 print:hidden
        `}>
          
          {/* Brand Header */}
          <div className={`p-4 border-b border-slate-700 flex items-center bg-slate-900 ${isCollapsed ? 'md:justify-center md:flex-col md:gap-2' : 'gap-3'} ${!isCollapsed || isMobileOpen ? 'gap-3' : ''}`}>
            <button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsCollapsed(!isCollapsed);
                } else {
                  setIsMobileOpen(false); // Can act as a close button on mobile
                }
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-2 overflow-hidden">
                <Calendar className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="font-bold text-slate-100 tracking-wide text-sm truncate">Duty Roster</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-y-auto overflow-x-hidden sidebar-scroll pb-4">
            {rosterNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed && !isMobileOpen ? item.name : undefined}
                  className={`flex items-center rounded-md font-medium transition-colors ${
                    isCollapsed && !isMobileOpen
                      ? 'md:flex-col md:justify-center md:py-3 md:px-1 md:gap-1 md:text-center' 
                      : 'flex-row py-2.5 px-3 space-x-3 text-[12px]'
                  } ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "hover:bg-slate-700 hover:text-slate-100 border border-transparent"
                  }`}
                >
                  <Icon className={`${isCollapsed && !isMobileOpen ? 'md:h-5 md:w-5' : 'h-4 w-4'} shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span className={`${isCollapsed && !isMobileOpen ? 'md:text-[9px] md:w-full md:line-clamp-2 md:leading-tight' : 'truncate'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* ROSTER MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0 print:block">
        
        {/* Roster-Specific Header */}
        {!isViewMode && (
          <header className="bg-white h-12 border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 shadow-sm shrink-0 print:hidden">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="font-bold text-slate-700 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">Roster System</div>
            </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Header Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/portal"
                className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Portal</span>
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 border-l border-slate-200 pl-2 sm:pl-4">
              <div className="text-right hidden md:block">
                <div className="text-[10px] font-bold text-slate-800 leading-tight">Admin User</div>
                <div className="text-[9px] font-medium text-blue-600">Roster Manager</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shrink-0">
                A
              </div>
            </div>
          </div>
        </header>
        )}
        
        {/* The active Roster page will be injected here */}
        <main className="flex-1 overflow-auto bg-slate-100 print:overflow-visible print:bg-white relative flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}