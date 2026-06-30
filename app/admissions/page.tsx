"use client";

import React, { useEffect, useState } from "react";
import { BedDouble, Search, RefreshCw, Table } from "lucide-react";

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/records/admissions');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch admissions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const filteredAdmissions = admissions.filter((row) => 
    Object.values(row).some((val) => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 min-h-screen">
      
      {/* TOOLBAR */}
      <div className="mb-3 flex flex-wrap gap-2 justify-between items-center bg-white p-2 border border-slate-300 rounded shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-100 p-1.5 rounded">
            <BedDouble className="h-4 w-4 text-teal-700" />
          </div>
          <h1 className="text-sm font-bold text-blue-950 tracking-tight">Admissions Register</h1>
          
          <button onClick={fetchAdmissions} className="ml-2 px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm shadow-sm transition-colors hover:bg-slate-50" title="Refresh Data">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-medium">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 w-48" 
            />
          </div>
          <span>Total Records: <strong className="text-blue-950">{filteredAdmissions.length.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 shadow-sm bg-slate-800 text-slate-100">
            <tr>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Admission / Consult #</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">UMR NO</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Patient Name</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Department</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap text-center">Is OD</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Added On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
               <tr>
                 <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">Loading records from database...</td>
               </tr>
            ) : filteredAdmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Table className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-50" />
                  <p className="text-sm font-medium text-slate-500">Database is Empty</p>
                  <p className="text-xs text-slate-400 mt-1">Upload records via the Database page first.</p>
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50 transition-none">
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-600 font-mono">{row.admnNo || "-"}</td>
                  <td className="border border-slate-200 px-3 py-1.5 font-medium text-blue-800">{row.umrNo || "-"}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-800 font-bold">{row.patientName || "-"}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-700">{row.department || "-"}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-center">
                    {row.isOd === "1" || row.isOd === "Yes" || row.isOd === "Y" ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">YES</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">NO</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-500">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}