"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Database,
    Printer,
    Layers,
    BookOpen,
    Activity,
    Menu
} from "lucide-react";

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const navItems = [
    { name: "Database", href: "/database", icon: Database },
    { name: "Result Bank", href: "/result-bank", icon: Layers },
    { name: "Print Box", href: "/print-box", icon: Printer },
    { name: "Dictionary Rules", href: "/short-names", icon: BookOpen },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && setIsMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden print:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-56'} 
        w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-lg shrink-0 print:hidden
      `}>
        
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-700/50 flex items-center bg-slate-950 ${isCollapsed ? 'md:justify-center md:flex-col md:gap-2' : 'gap-3'} ${!isCollapsed || isMobileOpen ? 'gap-3' : ''}`}>
          <button 
            onClick={() => {
              if (window.innerWidth >= 768) {
                setIsCollapsed(!isCollapsed);
              } else if (setIsMobileOpen) {
                setIsMobileOpen(false);
              }
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Activity className="h-5 w-5 text-teal-500 shrink-0" />
              <span className="font-bold text-slate-100 tracking-wide text-sm truncate">MedParser OS</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-y-auto overflow-x-hidden sidebar-scroll pb-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                title={isCollapsed && !isMobileOpen ? item.name : undefined}
                className={`flex items-center rounded-md font-medium transition-colors ${
                  isCollapsed && !isMobileOpen
                    ? 'md:flex-col md:justify-center md:py-3 md:px-1 md:gap-1 md:text-center' 
                    : 'flex-row py-2.5 px-3 space-x-3 text-[12px]'
                } ${
                  isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "hover:bg-slate-800 hover:text-slate-100 border border-transparent"
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
    </>
  );
}