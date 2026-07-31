"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Search, UserCircle, ArrowLeft, LogOut, Menu } from "lucide-react";

export default function Header({ setIsMobileOpen }: { setIsMobileOpen?: (open: boolean) => void }) {
  return (
    <header className="bg-white h-12 border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 shadow-sm shrink-0">
      
      <div className="flex items-center gap-2">
        {setIsMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden text-slate-500 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Global Search */}
        <div className="flex items-center w-full max-w-[150px] sm:max-w-none sm:w-64 bg-slate-100 rounded-full px-3 py-1 border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-colors">
          <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Global search..." 
            className="bg-transparent border-none outline-none text-[11px] w-full text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* User Controls & Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        
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

        <button className="hidden sm:flex relative text-slate-400 hover:text-blue-600 transition-colors border-l border-slate-200 pl-4">
          <Bell className="h-4 w-4" />
          <span className="absolute top-0 right-[-4px] bg-red-500 rounded-full h-2 w-2 border border-white"></span>
        </button>
        
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-2 sm:pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-800 leading-tight">Admin User</div>
            <div className="text-[9px] font-medium text-teal-600">System Operator</div>
          </div>
          <UserCircle className="h-6 w-6 text-slate-300 shrink-0" />
        </div>
      </div>
    </header>
  );
}