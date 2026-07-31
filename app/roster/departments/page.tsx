"use client";

import React, { useState, useEffect } from "react";
import { Building, Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State updated for custom JSON object
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    code: "",
    shiftTimings: [] as { name: string; sequence: number }[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, shiftsRes] = await Promise.all([
        fetch('/api/departments', { cache: 'no-store' }),
        fetch('/api/shifts', { cache: 'no-store' })
      ]);
      
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (shiftsRes.ok) setAvailableShifts(await shiftsRes.json());
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle toggling the shift on and off
  const handleCheckboxChange = (shiftName: string) => {
    setFormData(prev => {
      const exists = prev.shiftTimings.find(s => s.name === shiftName);
      if (exists) {
        return { ...prev, shiftTimings: prev.shiftTimings.filter(s => s.name !== shiftName) };
      } else {
        return { ...prev, shiftTimings: [...prev.shiftTimings, { name: shiftName, sequence: prev.shiftTimings.length + 1 }] };
      }
    });
  };

  // Handle typing a custom sequence number for a mapped shift
  const handleSequenceChange = (shiftName: string, seq: number) => {
    setFormData(prev => ({
      ...prev,
      shiftTimings: prev.shiftTimings.map(s => s.name === shiftName ? { ...s, sequence: seq } : s)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      return alert("Please fill in both the Department Name and Code.");
    }

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsFormOpen(false);
        setFormData({ id: "", name: "", code: "", shiftTimings: [] });
        fetchData();
      } else {
        alert("Failed to save department.");
      }
    } catch (error) {
      alert("Network error occurred.");
    }
  };

  const handleEdit = (dept: any) => {
    setFormData({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      // Ensure the database JSON is correctly parsed into the form
      shiftTimings: Array.isArray(dept.shiftTimings) ? dept.shiftTimings : []
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    try {
      const res = await fetch('/api/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Failed to delete department.");
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 relative">
      <div className="mb-4 flex flex-col gap-3 bg-white p-4 border border-slate-300 rounded shadow-sm">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded text-amber-600 border border-amber-100">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">Departments</h1>
              <p className="text-xs text-slate-500 font-medium">Manage hospital departments and their eligible duty shifts</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFormData({ id: "", name: "", code: "", shiftTimings: [] });
              setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-sm font-bold text-[11px] hover:bg-blue-700 transition-colors shadow-sm"
          >
            {isFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} 
            {isFormOpen ? "Cancel" : "Add Department"}
          </button>
        </div>

        {/* Form Section */}
        {isFormOpen && (
          <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-200 rounded-sm mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Department Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Pathology" 
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 bg-white" 
                />
              </div>
              <div className="w-[150px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Department Code</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g. PATH" 
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-mono font-bold text-black focus:outline-blue-500 bg-white uppercase" 
                />
              </div>
            </div>

            {/* Dynamic Shift Selection with Sequence Inputs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-2">Assign & Sequence Shift Timings</label>
              {availableShifts.length === 0 ? (
                <div className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-sm border border-red-100">
                  No shifts found! Please add shifts in the "Duty Timings" page first.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableShifts.map((shift) => {
                    const assignedShift = formData.shiftTimings.find(s => s.name === shift.name);
                    const isSelected = !!assignedShift;

                    return (
                      <div key={shift.id} className={`flex items-center gap-2 border px-3 py-1.5 rounded-sm transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(shift.name)}
                          className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex flex-col cursor-pointer" onClick={() => handleCheckboxChange(shift.name)}>
                          <span className="text-[11px] font-bold text-slate-800">{shift.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">{shift.dailyTime}</span>
                        </div>
                        
                        {/* Sequence Input only shows when checked! */}
                        {isSelected && (
                          <input 
                            type="number"
                            title="Set order sequence"
                            value={assignedShift.sequence || ''}
                            onChange={(e) => handleSequenceChange(shift.name, parseInt(e.target.value) || 0)}
                            className="w-12 ml-2 py-0.5 px-1 border border-slate-300 rounded-sm text-[10px] text-center font-bold text-black focus:outline-blue-500 bg-white shadow-sm"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 mt-2">
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-1.5 rounded-sm text-[11px] font-bold flex items-center shadow-sm">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Department
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Data Table Section */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-800 text-slate-100 sticky top-0 z-10">
            <tr>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold w-16 text-[11px] uppercase tracking-wider">S.No</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold w-64 text-[11px] uppercase tracking-wider">Dept Name</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold w-32 text-[11px] uppercase tracking-wider">Code</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Sequenced Shift Timings</th>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold w-24 text-[11px] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
               <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-xs font-bold">Loading Departments...</td></tr>
            ) : departments.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-xs font-bold">No Departments Configured</td></tr>
            ) : (
              departments.map((dept, index) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="border border-slate-200 px-4 py-2.5 text-center font-bold text-slate-500">{index + 1}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-bold text-slate-800">{dept.name}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-mono font-medium text-blue-700 bg-blue-50/30">{dept.code}</td>
                  <td className="border border-slate-200 px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(dept.shiftTimings) && dept.shiftTimings.length > 0 ? (
                        // This safely sorts the shifts based on the custom sequence number you provided!
                        [...dept.shiftTimings].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)).map((shift: any, i: number) => (
                          <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-sm text-[10px] font-bold flex items-center gap-1">
                            <span className="text-blue-600 font-mono">{shift.sequence}.</span> {shift.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] italic text-slate-400">No shifts assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-slate-200 px-4 py-2.5">
                    <div className="flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(dept)} className="text-blue-600 hover:text-blue-800" title="Edit Department">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-800" title="Delete Department">
                        <Trash2 className="h-4 w-4" />
                      </button>
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