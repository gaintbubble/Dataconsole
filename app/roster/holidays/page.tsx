"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react";

type PublicHoliday = {
  id: string;
  name: string;
  date: string;
  description: string;
  color: string;
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    color: "#fed7aa" // Default orange-200
  });

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error("Failed to fetch holidays", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setFormData({ name: "", date: "", description: "", color: "#fed7aa" });
        fetchHolidays();
      } else {
        alert("Failed to add holiday.");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchHolidays();
      } else {
        alert("Failed to delete holiday.");
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-full overflow-y-auto">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Public Holidays
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage holidays and set custom highlight colors for the roster sheet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Holiday Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Plus className="h-4 w-4 text-slate-400" />
              Add New Holiday
            </h2>
            
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Holiday Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Christmas Day"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Highlight Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="h-10 w-16 p-1 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer transition-all"
                  />
                  <div className="flex-1 text-xs text-slate-500 font-medium">
                    This color will highlight the entire column on the duty roster sheet.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Brief description"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Plus className="h-4 w-4" /> Add Holiday</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Holidays List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Scheduled Holidays</h2>
            <button onClick={fetchHolidays} className="text-slate-400 hover:text-blue-600 transition-colors">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
              <RefreshCw className="h-6 w-6 text-slate-300 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Loading holidays...</p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
              <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-3 opacity-50" />
              <h3 className="text-slate-700 font-bold mb-1">No Holidays Found</h3>
              <p className="text-sm text-slate-500 font-medium">Add a new public holiday using the form on the left.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Color indicator */}
                    <div 
                      className="h-12 w-12 rounded-md shadow-inner border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: holiday.color }}
                      title={`Highlight color: ${holiday.color}`}
                    />
                    
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{holiday.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {holiday.description && (
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {holiday.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(holiday.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Holiday"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}