"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
   Database, 
   Printer, 
   Layers, 
   BookOpen, 
   LogOut, 
   Activity 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Database", href: "/database", icon: Database },
    { name: "Result Bank", href: "/result-bank", icon: Layers },
    { name: "Print Box", href: "/print-box", icon: Printer },
    { name: "Dictionary Rules", href: "/short-names", icon: BookOpen },
  ];

  return (
    <div className="w-48 bg-slate-900 text-slate-300 flex flex-col h-full shadow-lg">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center space-x-2 bg-slate-950">
        <Activity className="h-5 w-5 text-teal-500 shrink-0" />
        <span className="font-bold text-slate-100 tracking-wide text-sm truncate">MedParser OS</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-[11px] font-medium transition-colors ${
                isActive 
                   ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                   : "hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Secure Logout</span>
        </button>
      </div>
    </div>
  );
}