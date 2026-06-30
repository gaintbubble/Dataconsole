"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Upload, Save, Trash2, Table, Search, RefreshCw, AlertTriangle } from "lucide-react";

export default function DatabasePage() {
  const [data, setData] = useState<any[]>([]);
  const [deptDict, setDeptDict] = useState<Record<string, string>>({});
  const [wardDict, setWardDict] = useState<Record<string, string>>({}); // 1. ADDED WARD DICTIONARY STATE
  
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [patientType, setPatientType] = useState<"Both" | "IP" | "OP">("Both");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const OP_COLUMNS = ["UMR #", "Name", "Doctor Dept Name", "Is OD"];
  const IP_COLUMNS = ["Admission #", "UMR #", "Name", "Admitted Ward", "Is OD"];
  const ALL_COLUMNS = ["Admission #", "Status", "UMR #", "Name", "Doctor Dept Name", "Admitted Ward", "Consultation#", "Is OD"];

  let displayColumns = ALL_COLUMNS;
  if (patientType === "OP") displayColumns = OP_COLUMNS;
  if (patientType === "IP") displayColumns = IP_COLUMNS;

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/records?type=database');
      if (res.ok) {
        const dbData = await res.json();
        const mappedData = dbData.map((dbRow: any) => {
          const isIpRecord = dbRow.ward && dbRow.ward !== "-";
          
          return {
            id: dbRow.id,
            "Admission #": dbRow.admnNo || "-",
            "Status": "-", 
            "UMR #": dbRow.umrNo || "-",
            "Name": dbRow.patientName || "-",
            "Doctor Dept Name": dbRow.department || "-",
            "Admitted Ward": dbRow.ward || "-", 
            "Consultation#": dbRow.admnNo || "-",
            "Is OD": dbRow.isOd || "-",
            _viewType: isIpRecord ? "IP" : "OP",
            _hiddenAdmnNo: dbRow.admnNo
          };
        });
        setData(mappedData);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDictionaries = async () => {
    try {
      const res = await fetch('/api/mappings');
      if (res.ok) {
        const mappings = await res.json();
        const dDict: Record<string, string> = {};
        const wDict: Record<string, string> = {}; // 2. PREPARE WARD DICTIONARY
        
        mappings.forEach((m: any) => {
          const cleanKey = m.originalName.toLowerCase().replace(/\s+/g, " ").trim();
          if (m.category === "Department") dDict[cleanKey] = m.shortName;
          if (m.category === "Ward") wDict[cleanKey] = m.shortName; // 2. POPULATE WARD DICTIONARY
        });
        
        setDeptDict(dDict);
        setWardDict(wDict); // 2. SAVE WARD DICTIONARY
      }
    } catch (e) {
      console.error("Failed to load dictionary.");
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchDictionaries(); 
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsParsing(true);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const fileHeaders = Object.keys(jsonData[0] as object);
          const hasAdmissionColumn = fileHeaders.includes("Admission #");
          const forcedDocType = hasAdmissionColumn ? "IP" : "OP";

          const newExtractedData = jsonData.map((row: any) => {
            
            // DEPARTMENT TRANSLATION
            let rawDept = row["Doctor Dept Name"]?.toString() || row["Dept Name"]?.toString() || "";
            if (rawDept) {
              const cleanDeptKey = rawDept.replace(/\s+/g, " ").trim().toLowerCase();
              if (deptDict[cleanDeptKey]) rawDept = deptDict[cleanDeptKey];
            }

            // 3. WARD TRANSLATION ENGINE
            let rawWard = row["Admitted Ward"]?.toString() || row["Ward"]?.toString() || "";
            if (rawWard) {
              const cleanWardKey = rawWard.replace(/\s+/g, " ").trim().toLowerCase();
              if (wardDict[cleanWardKey]) rawWard = wardDict[cleanWardKey];
            }

            return {
              "Admission #": row["Admission #"]?.toString() || "-",
              "Status": row["Status"]?.toString() || "-",
              "UMR #": row["UMR #"]?.toString() || row["UMR"]?.toString() || "",
              "Name": row["Name"]?.toString() || "",
              "Doctor Dept Name": rawDept, 
              "Admitted Ward": rawWard, // 3. USE TRANSLATED WARD NAME
              "Consultation#": row["Consultation#"]?.toString() || "",
              "Is OD": row["Is OD"]?.toString() || "",
              _viewType: forcedDocType,
              _hiddenAdmnNo: row["Admission #"]?.toString() || row["Consultation#"]?.toString() || `TEMP-${Math.random().toString(36).substr(2, 9)}`
            };
          });

          // UMR DEDUPLICATION
          setData(prevData => {
            const existingUmrs = new Set(
              prevData
                .map(row => row["UMR #"])
                .filter(umr => umr && umr !== "-") 
            );

            const uniqueNewRecords: any[] = [];
            let duplicateCount = 0;

            for (const row of newExtractedData) {
              const currentUmr = row["UMR #"];
              if (currentUmr && existingUmrs.has(currentUmr)) {
                duplicateCount++;
              } else {
                if (currentUmr) existingUmrs.add(currentUmr); 
                uniqueNewRecords.push(row);
              }
            }

            if (duplicateCount > 0) {
              setTimeout(() => alert(`Upload complete! Removed ${duplicateCount} duplicate records based on UMR #.`), 100);
            }

            return [...uniqueNewRecords, ...prevData];
          });
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Failed to parse the file.");
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveToDatabase = async () => {
    const unsavedRecords = data.filter(r => !r.id);
    if (unsavedRecords.length === 0) return alert("No new records to save.");
    
    setIsSaving(true);
    const dbPayload = unsavedRecords.map((row) => ({
      admnNo: row._hiddenAdmnNo,
      umrNo: row["UMR #"],
      patientName: row["Name"],
      department: row["Doctor Dept Name"],
      ward: row["Admitted Ward"],
      isOd: row["Is OD"], 
    }));

    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: dbPayload }),
      });

      if (response.ok) {
        const serverResponse = await response.json();
        if (serverResponse.count === 0) {
          alert("No new records saved. These records already exist in the database!");
        } else {
          alert(`Success! Saved ${serverResponse.count} new records to the database.`);
        }
        fetchRecords();
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Network error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWipeDatabase = async () => {
    if (!confirm("⚠️ WARNING: Are you sure you want to completely wipe ALL patient records from the database? Result Bank data will NOT be affected.")) return;
    
    try {
      const res = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true, type: 'database' }) 
      });
      
      if (res.ok) {
        alert("Success: Database has been securely wiped.");
        fetchRecords();
        setData([]);
      } else {
        alert("Failed to wipe the database.");
      }
    } catch (error) {
      alert("Network error while trying to delete.");
    }
  };

  const handleClearData = () => {
    if (confirm("Clear local unsaved data? (Database records will remain)")) {
      setData(prev => prev.filter(r => r.id));
    }
  };

  const filteredData = data.filter((row) => {
    if (patientType === "IP" && row._viewType === "OP") return false;
    if (patientType === "OP" && row._viewType === "IP") return false;

    return Object.keys(row).some((key) => {
      if (key === "_hiddenAdmnNo" || key === "_viewType" || key === "id") return false;
      return String(row[key]).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 min-h-screen">
      
      {/* --- SINGLE-LINE TOP TOOLBAR --- */}
      <div className="mb-2 flex flex-nowrap justify-between items-center bg-white p-1.5 border border-slate-300 rounded shadow-sm overflow-x-auto whitespace-nowrap">
        
        {/* Buttons Group */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] flex items-center rounded-sm font-medium transition-colors"
          >
            <Upload className="h-3 w-3 mr-1" />
            {isParsing ? 'Extracting...' : 'Add Data'}
          </button>
          
          {data.some(r => !r.id) && (
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-sm flex items-center shadow-sm transition-colors"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save DB'}
            </button>
          )}

          <button onClick={() => { fetchRecords(); fetchDictionaries(); }} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm shadow-sm transition-colors" title="Refresh Database">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {data.some(r => !r.id) && (
            <button
              onClick={handleClearData}
              className="px-2 py-1 bg-white border border-red-200 text-red-600 text-[10px] hover:bg-red-50 flex items-center rounded-sm transition-colors"
              title="Clear Staged Data"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}

          {data.some(r => r.id) && (
            <button
              onClick={handleWipeDatabase}
              className="ml-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold hover:bg-red-100 flex items-center rounded-sm transition-colors shadow-sm"
              title="Wipe all saved records"
            >
              <AlertTriangle className="h-3 w-3 mr-1" /> Wipe DB
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-medium shrink-0 ml-3">
          
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shadow-sm">
            <span className="font-semibold text-slate-600 border-r border-slate-200 pr-2">View:</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="patientType" value="Both" checked={patientType === "Both"} onChange={() => setPatientType("Both")} className="accent-blue-600" />
              <span className={patientType === "Both" ? "text-blue-700 font-bold" : "text-slate-600"}>All</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="patientType" value="IP" checked={patientType === "IP"} onChange={() => setPatientType("IP")} className="accent-blue-600" />
              <span className={patientType === "IP" ? "text-blue-700 font-bold" : "text-slate-600"}>IP</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="patientType" value="OP" checked={patientType === "OP"} onChange={() => setPatientType("OP")} className="accent-blue-600" />
              <span className={patientType === "OP" ? "text-blue-700 font-bold" : "text-slate-600"}>OP</span>
            </label>
          </div>

          <div className="relative">
            <Search className="absolute left-1.5 top-1 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-5 pr-2 py-1 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 w-32 text-black"
            />
          </div>
          
          <span>Rows: <strong className="text-blue-950">{filteredData.length.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 shadow-sm bg-slate-800 text-slate-100">
            <tr>
              <th className="px-2 py-2 font-semibold w-16 text-center">Status</th>
              {displayColumns.map((col, i) => (
                <th key={i} className="px-2 py-2 font-semibold whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
               <tr>
                 <td colSpan={displayColumns.length + 1} className="py-12 text-center text-slate-500 font-medium">Loading database records...</td>
               </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={displayColumns.length + 1} className="py-12 text-center">
                  <Table className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-50" />
                  <p className="text-sm font-medium text-slate-500">No Data Found</p>
                  <p className="text-xs text-slate-400 mt-1">Check your search filters or upload a spreadsheet.</p>
                </td>
              </tr>
            ) : (
              filteredData.slice(0, 500).map((row, rowIndex) => (
                <tr key={rowIndex} className={`hover:bg-blue-50 transition-none ${!row.id ? 'bg-yellow-50' : ''}`}>
                  <td className="border border-slate-200 px-2 py-1.5 text-center select-none">
                    {row.id ? (
                      <span className="text-emerald-600 font-bold">Saved</span>
                    ) : (
                      <span className="text-yellow-600 font-bold">New</span>
                    )}
                  </td>
                  {displayColumns.map((col, colIndex) => (
                    <td key={colIndex} className="border border-slate-200 px-2 py-1.5 truncate max-w-[200px] text-slate-800 font-medium" title={row[col]}>
                      {row[col] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filteredData.length > 500 && (
        <div className="mt-1 text-center text-[10px] text-slate-500 font-medium">
          Showing first 500 rows. Filter or search to view more of the {filteredData.length.toLocaleString()} total records.
        </div>
      )}
    </div>
  );
}