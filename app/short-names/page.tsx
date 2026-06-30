"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, Search, Edit2 } from "lucide-react";

export default function ShortNamesPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Form & Nav State
  const [category, setCategory] = useState("Parameter");
  const [originalName, setOriginalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [sequence, setSequence] = useState<string | number>("");
  const [activeDepartment, setActiveDepartment] = useState("Biochemistry");

  const NAV_TABS = [
    { label: "Parameter Names", value: "Parameter" },
    { label: "Admitted Wards", value: "Ward" },
    { label: "Result Values", value: "Result" },
    { label: "Doctor Depts", value: "Department" }
  ];

  const DEPARTMENTS = ["Biochemistry", "Haematology", "Clinical Pathology", "Serology", "Microbiology"];

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mappings');
      if (res.ok) {
        const data = await res.json();
        setMappings(data);
      }
    } catch (err) {
      console.error("Failed to load mappings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalName || !shortName) return alert("Please fill all required fields");

    try {
      const res = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          originalName, 
          shortName,
          department: category === "Parameter" ? activeDepartment : null,
          sequence 
        })
      });

      if (res.ok) {
        setOriginalName("");
        setShortName("");
        setSequence(""); 
        fetchMappings();
      } else {
        // NEW: Show the exact error message from the backend (e.g., "Sequence #2 is already used")
        const errData = await res.json();
        alert(errData.error || "Failed to save. It might already exist.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleEdit = (mapping: any) => {
    setCategory(mapping.category);
    setOriginalName(mapping.originalName);
    setShortName(mapping.shortName);
    setSequence(mapping.sequence || ""); 
    
    if (mapping.category === "Parameter") {
      setActiveDepartment(mapping.department || "Biochemistry");
    }
    
    document.getElementById('shortNameInput')?.focus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this short name rule?")) return;
    try {
      const res = await fetch('/api/mappings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchMappings();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  // ADVANCED FILTERING & SORTING LOGIC
  const filteredMappings = mappings
    .filter(m => {
      if (m.category !== category) return false;
      if (category === "Parameter" && m.department !== activeDepartment) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        m.originalName.toLowerCase().includes(searchLower) || 
        m.shortName.toLowerCase().includes(searchLower)
      );
    })
    // NEW: Strictly sort the visible table by Sequence Number
    .sort((a, b) => {
      if (category === "Parameter") {
        // If a sequence is missing/null, push it to the very bottom (9999)
        const seqA = a.sequence !== null ? a.sequence : 9999;
        const seqB = b.sequence !== null ? b.sequence : 9999;
        return seqA - seqB; 
      }
      return 0; // Don't touch the sorting for Wards, Results, etc.
    });

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 min-h-screen">
      
      {/* TOP TOOLBAR / NAVIGATION */}
      <div className="mb-4 flex flex-col gap-3 bg-white p-4 border border-slate-300 rounded shadow-sm">
        
        {/* NAV TABS & SEARCH */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-1">
          <div className="flex space-x-2">
            {NAV_TABS.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setCategory(tab.value);
                  setSearchTerm(""); 
                }}
                className={`px-4 py-2.5 text-[11px] font-bold border-b-2 transition-colors rounded-t-sm ${
                  category === tab.value
                    ? "border-teal-600 text-teal-700 bg-teal-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search rules..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-7 pr-3 py-1.5 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 w-52 text-[11px] text-black transition-all" 
            />
          </div>
        </div>

        {/* COMPACT ENTRY FORM */}
        <form onSubmit={handleSave} className="flex flex-wrap gap-x-6 gap-y-3 items-end pt-1">
          
          <div className="w-[120px]">
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Target Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full py-1.5 px-2 border border-slate-300 bg-slate-50 rounded-sm text-[11px] font-medium focus:outline-none text-slate-700 shadow-sm cursor-not-allowed" disabled>
              <option value="Parameter">Parameter Name</option>
              <option value="Ward">Admitted Ward</option>
              <option value="Result">Result Value</option>
              <option value="Department">Doctor Dept Name</option>
            </select>
          </div>

          {/* Sequence (Only show on 'Parameter' tab) */}
          {category === "Parameter" && (
            <div className="w-[60px]">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Seq #</label>
              <input 
                type="number" 
                min="1"
                value={sequence} 
                onChange={e => setSequence(e.target.value)} 
                placeholder="1" 
                className="w-full py-1.5 px-2 border border-slate-300 bg-white rounded-sm text-[11px] font-bold focus:outline-blue-500 text-black text-center shadow-sm" 
              />
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Original Long Name (From Excel)</label>
            <input type="text" value={originalName} onChange={e => setOriginalName(e.target.value)} placeholder="e.g. glycated hemoglobin (hba1c)" className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-medium focus:outline-blue-500 bg-white text-black shadow-sm" />
          </div>
          
          <div className="w-[140px]">
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Short Name</label>
            <input id="shortNameInput" type="text" value={shortName} onChange={e => setShortName(e.target.value)} placeholder="e.g. A1c" className="w-full py-1.5 px-2 border border-slate-300 rounded-sm text-[11px] font-bold focus:outline-blue-500 bg-white text-blue-800 shadow-sm" />
          </div>
          
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-1.5 rounded-sm text-[11px] font-bold flex items-center shadow-sm transition-colors h-[28px]">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Rule
          </button>
        </form>
      </div>

      {/* SUB-NAVIGATION FOR DEPARTMENTS */}
      {category === "Parameter" && (
        <div className="mb-2 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => {
                setActiveDepartment(dept);
                setSearchTerm("");
              }}
              className={`px-5 py-1.5 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap shadow-sm border ${
                activeDepartment === dept
                  ? "bg-teal-600 border-teal-700 text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* EXCEL-STYLE DATA TABLE */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 shadow-sm bg-slate-800 text-slate-100">
            <tr>
              {/* Dynamic Headers based on active tab */}
              {category === "Parameter" && (
                <th className="border border-slate-600 px-4 py-2 font-semibold w-16 text-center">Seq</th>
              )}
              <th className="border border-slate-600 px-4 py-2 font-semibold">Original Name</th>
              <th className="border border-slate-600 px-4 py-2 font-semibold w-40 text-blue-300">Short Name</th>
              <th className="border border-slate-600 px-4 py-2 font-semibold w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-medium">Loading rules...</td></tr>
            ) : filteredMappings.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-slate-500">No matching rules found on this page.</td></tr>
            ) : (
              filteredMappings.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50 transition-none">
                  
                  {/* Dynamic Columns based on active tab */}
                  {category === "Parameter" && (
                    <td className="border border-slate-200 px-4 py-1.5 font-bold text-center text-slate-800">
                      {m.sequence || "-"}
                    </td>
                  )}

                  <td className="border border-slate-200 px-4 py-1.5 text-slate-800">{m.originalName}</td>
                  <td className="border border-slate-200 px-4 py-1.5 font-bold text-blue-800">{m.shortName}</td>
                  
                  <td className="border border-slate-200 px-4 py-1.5 text-center">
                    <div className="flex justify-center space-x-4">
                      <button onClick={() => handleEdit(m)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit Rule">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete Rule">
                        <Trash2 className="h-3.5 w-3.5" />
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