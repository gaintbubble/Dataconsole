"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function StaffMappingPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All"); 
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    sequence: "",
    empId: "",
    name: "",
    department: "",
    status: "Active"
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, deptRes] = await Promise.all([
        fetch('/api/staff', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' })
      ]);
      
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empId || !formData.name || !formData.department) {
      return alert("Please fill in all fields and select a Department.");
    }

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsFormOpen(false);
        setFormData({ id: "", sequence: "", empId: "", name: "", department: "", status: "Active" });
        fetchData();
      } else {
        alert("Failed to save staff member.");
      }
    } catch (error) {
      alert("Network error occurred.");
    }
  };

  const handleEdit = (staff: any) => {
    setFormData({
      ...staff,
      sequence: staff.sequence.toString()
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member from the roster?")) return;
    
    try {
      const res = await fetch('/api/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Failed to delete staff member.");
    }
  };

  // Upgraded Filtering Logic combining text search AND department dropdown
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = 
      staff.empId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDept = filterDept === "All" || staff.department === filterDept;
    
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 relative">
      
      {/* HEADER & CONTROLS - Now in a single inline row */}
      <div className="mb-4 flex flex-col gap-3 bg-white p-4 border border-slate-300 rounded shadow-sm">
        
        <div className="flex items-center justify-between gap-4">
          
          {/* Left Side: Search Bar & Department Filter */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-sm px-3 py-1.5 w-[300px] shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search Emp ID or Name..." 
                className="bg-transparent border-none outline-none text-xs font-medium text-slate-800 w-full placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              value={filterDept} 
              onChange={(e) => setFilterDept(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-sm text-xs font-medium text-slate-700 bg-slate-50 outline-none focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          {/* Right Side: Map New Staff Button */}
          <button 
            onClick={() => {
              setFormData({ id: "", sequence: "", empId: "", name: "", department: "", status: "Active" });
              setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-sm font-bold text-[11px] hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            {isFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} 
            {isFormOpen ? "Cancel Mapping" : "Map New Staff"}
          </button>
        </div>

        {/* INLINE FORM */}
        {isFormOpen && (
          <form onSubmit={handleSave} className="flex flex-wrap items-end gap-4 p-3 bg-slate-50 border border-slate-200 rounded-sm mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="w-[70px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Seq. No</label>
              <input type="number" value={formData.sequence} onChange={e => setFormData({...formData, sequence: e.target.value})} placeholder="1" className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 bg-white" />
            </div>
            <div className="w-[120px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Employee ID</label>
              <input type="text" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} disabled={!!formData.id} placeholder="e.g. 1001" className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 disabled:bg-slate-200" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dr. John Doe" className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] text-black focus:outline-blue-500" />
            </div>
            <div className="w-[200px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Department</label>
              <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-medium text-black focus:outline-blue-500 bg-white">
                <option value="" disabled>Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="w-[100px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-sm text-[11px] font-bold flex items-center shadow-sm h-[28px]">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save
            </button>
          </form>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm relative">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="bg-slate-800 text-slate-100 sticky top-0 z-10">
            <tr>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold uppercase tracking-wider text-[11px] w-16">S.No</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold uppercase tracking-wider text-[11px] w-48">Department</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold uppercase tracking-wider text-[11px] w-24">Emp ID</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold uppercase tracking-wider text-[11px]">Employee Name</th>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold uppercase tracking-wider text-[11px] w-24">Status</th>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold uppercase tracking-wider text-[11px] w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
               <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-bold">Loading Staff Records...</td></tr>
            ) : filteredStaff.length === 0 ? (
               <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-bold">No Staff Members Found</td></tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="border border-slate-200 px-4 py-2.5 text-center font-bold text-slate-800 bg-slate-50/50">{staff.sequence}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-bold text-blue-800 bg-blue-50/20">{staff.department}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-mono font-bold text-slate-500">{staff.empId}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-bold text-slate-800">{staff.name}</td>
                  <td className="border border-slate-200 px-4 py-2.5 text-center">
                    {staff.status === "Active" ? (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border border-green-200">Active</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border border-slate-300">Inactive</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-2.5">
                    <div className="flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(staff)} className="text-blue-600 hover:text-blue-800" title="Edit Staff"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(staff.id)} className="text-red-600 hover:text-red-800" title="Delete Staff"><Trash2 className="h-4 w-4" /></button>
                    </div>
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