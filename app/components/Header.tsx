"use client";

import React from "react";
import { Bell, Search, UserCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white h-12 border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0">
      {/* Global Search */}
      <div className="flex items-center w-64 bg-slate-100 rounded-full px-3 py-1 border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-colors">
        <Search className="h-3.5 w-3.5 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Global patient search..." 
          className="bg-transparent border-none outline-none text-[11px] w-full text-slate-700 placeholder-slate-400 font-medium"
        />
      </div>

      {/* User Controls */}
      <div className="flex items-center space-x-4">
        <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-2 w-2 border border-white"></span>
        </button>
        
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-800 leading-tight">Admin User</div>
            <div className="text-[9px] font-medium text-teal-600">System Operator</div>
          </div>
          <UserCircle className="h-6 w-6 text-slate-300" />
        </div>
      </div>
    </header>
  );
}