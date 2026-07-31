"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function DutyTimingsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    sequence: "",
    name: "",
    dailyTime: ""
  });

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shifts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setShifts(data);
      }
    } catch (error) {
      console.error("Failed to load shifts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dailyTime) {
      return alert("Please fill in both the Shift Name and Daily Time.");
    }

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsFormOpen(false);
        setFormData({ id: "", sequence: "", name: "", dailyTime: "" });
        fetchShifts();
      } else {
        alert("Failed to save shift.");
      }
    } catch (error) {
      alert("Network error occurred.");
    }
  };

  const handleEdit = (shift: any) => {
    setFormData({
      id: shift.id,
      sequence: shift.sequence.toString(),
      name: shift.name,
      dailyTime: shift.dailyTime
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    
    try {
      const res = await fetch('/api/shifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchShifts();
    } catch (error) {
      alert("Failed to delete shift.");
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 relative">
      <div className="mb-4 flex flex-col gap-3 bg-white p-4 border border-slate-300 rounded shadow-sm">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded text-indigo-600 border border-indigo-100">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">Shift Mapping</h1>
              <p className="text-xs text-slate-500 font-medium">Configure daily shift timings and names</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFormData({ id: "", sequence: "", name: "", dailyTime: "" });
              setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-sm font-bold text-[11px] hover:bg-blue-700 transition-colors shadow-sm"
          >
            {isFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} 
            {isFormOpen ? "Cancel" : "Add Shift"}
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSave} className="flex flex-wrap items-end gap-4 p-3 bg-slate-50 border border-slate-200 rounded-sm mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="w-[80px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Seq. No</label>
              <input 
                type="number" 
                value={formData.sequence} 
                onChange={e => setFormData({...formData, sequence: e.target.value})} 
                placeholder="1" 
                className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 bg-white" 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Shift Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Morning Shift" 
                className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold text-black focus:outline-blue-500 bg-white" 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Daily Time</label>
              <input 
                type="text" 
                value={formData.dailyTime} 
                onChange={e => setFormData({...formData, dailyTime: e.target.value})} 
                placeholder="e.g. 09:00 AM - 05:00 PM" 
                className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-mono text-black focus:outline-blue-500 bg-white" 
              />
            </div>
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-1.5 rounded-sm text-[11px] font-bold flex items-center shadow-sm h-[28px]">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Shift
            </button>
          </form>
        )}
      </div>

      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-800 text-slate-100 sticky top-0 z-10">
            <tr>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold w-20 text-[11px] uppercase tracking-wider">Seq</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold w-64 text-[11px] uppercase tracking-wider">Daily Time</th>
              <th className="border border-slate-600 px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Shift Name</th>
              <th className="border border-slate-600 px-4 py-3 text-center font-bold w-24 text-[11px] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
               <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-xs font-bold">Loading Shifts...</td></tr>
            ) : shifts.length === 0 ? (
               <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-xs font-bold">No Shifts Configured</td></tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="border border-slate-200 px-4 py-2.5 text-center font-bold text-slate-800 bg-slate-50/50">{shift.sequence}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-mono font-medium text-slate-600 bg-slate-50/50">{shift.dailyTime}</td>
                  <td className="border border-slate-200 px-4 py-2.5 font-bold text-slate-800">{shift.name}</td>
                  <td className="border border-slate-200 px-4 py-2.5">
                    <div className="flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(shift)} className="text-blue-600 hover:text-blue-800" title="Edit Shift">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-800" title="Delete Shift">
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