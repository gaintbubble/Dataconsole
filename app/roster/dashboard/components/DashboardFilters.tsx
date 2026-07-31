"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Users, Calendar } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DashboardFiltersProps {
  departments: Department[];
  defaultDate: string;
}

export default function DashboardFilters({ departments, defaultDate }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDate = searchParams.get("date") || defaultDate;
  const selectedDept = searchParams.get("dept") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/roster/dashboard?${params.toString()}`);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between bg-white p-2 border border-slate-300 rounded shadow-sm gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Compact Title Badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <LayoutDashboard className="h-4 w-4 text-blue-600" />
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider hidden sm:inline-block">Dashboard</span>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1 h-8 bg-slate-50 border border-slate-300 rounded-sm px-1.5 shadow-sm shrink-0">
          <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
          <span className="text-[9px] text-slate-500 font-bold uppercase mx-0.5 hidden sm:block">Date</span>
          <input
            type="date"
            className="appearance-none bg-transparent py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[90px] sm:w-[100px]"
            value={selectedDate}
            onChange={(e) => handleFilterChange("date", e.target.value)}
          />
        </div>

        {/* Department Selector */}
        <div className="flex items-center bg-slate-50 rounded-sm border border-slate-300 shadow-sm px-1.5 h-8 shrink-0">
          <Users className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
          <select
            className="appearance-none bg-transparent pr-4 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none w-[100px] lg:w-[120px] truncate"
            value={selectedDept}
            onChange={(e) => handleFilterChange("dept", e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
