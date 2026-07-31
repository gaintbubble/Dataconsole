"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Database, CalendarDays, Activity, LogOut } from "lucide-react";

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration matching your login theme */}
      <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <div className="bg-slate-950 p-3 rounded-md inline-block mb-4 shadow-sm border border-slate-800">
            <Activity className="h-8 w-8 text-teal-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">MedParser OS</h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">Select a module workspace to continue</p>
        </div>

        {/* Module Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          
          {/* Data Console Module */}
          <Link 
            href="/database" 
            className="group bg-slate-800/80 border border-slate-700 hover:border-teal-500 rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-slate-800 shadow-lg hover:shadow-teal-900/20"
          >
            <div className="h-16 w-16 bg-slate-950 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-800 group-hover:border-teal-500/50">
              <Database className="h-8 w-8 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Data Console</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage patient database records, process laboratory mappings, and print consolidated reports.
            </p>
          </Link>

          {/* Roster Module (Active) */}
          <Link 
            href="/roster" 
            className="group bg-slate-800/80 border border-slate-700 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-slate-800 shadow-lg hover:shadow-blue-900/20"
          >
            <div className="h-16 w-16 bg-slate-950 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-800 group-hover:border-blue-500/50">
              <CalendarDays className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Roster</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage employee schedules, shift timings, department assignments, and public holidays.
            </p>
          </Link>

        </div>

        {/* Secure Logout Footer */}
        <div className="mt-16 text-center">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center mx-auto"
          >
            <LogOut className="h-4 w-4 mr-2" /> Secure Logout
          </button>
        </div>
      </div>
    </div>
  );
}