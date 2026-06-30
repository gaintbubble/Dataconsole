"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Search, Upload, Trash2, Table, Save, RefreshCw, AlertTriangle, Database, Clock } from "lucide-react";
import ExcelJS from "exceljs";

const ALLOWED_COLUMNS = [
  "Date", "Sl. No.", "UMR NO", "Patient Name", "Age", "Gender",
  "Admn No", "Bill No", "Parameter Name", "Result Value", "Ward"
];

const dbKeyMap: Record<string, string> = {
  "Date": "resultDate",
  "Sl. No.": "slNo",
  "UMR NO": "umrNo",
  "Patient Name": "patientName",
  "Age": "age",
  "Gender": "gender",
  "Admn No": "admnNo",
  "Bill No": "billNo",
  "Parameter Name": "parameterName",
  "Result Value": "resultValue",
  "Ward": "ward" 
};

export default function ResultBank() {
  const [masterHeaders, setMasterHeaders] = useState<string[]>(ALLOWED_COLUMNS);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [umrLookup, setUmrLookup] = useState<Record<string, string>>({}); 
  
  const [paramDict, setParamDict] = useState<Record<string, string>>({});
  const [wardDict, setWardDict] = useState<Record<string, string>>({});
  const [resultDict, setResultDict] = useState<Record<string, string>>({});

  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [patientType, setPatientType] = useState<"Both" | "IP" | "OP">("Both");
  const [searchTerm, setSearchTerm] = useState("");

  const [isCleanupMenuOpen, setIsCleanupMenuOpen] = useState(false);
  const [cleanupHours, setCleanupHours] = useState<number>(48);
  const [isCleaning, setIsCleaning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cleanupMenuRef = useRef<HTMLDivElement>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const [dbRes, mapRes] = await Promise.all([
        fetch('/api/records'),
        fetch('/api/mappings')
      ]);
      
      let pDict: Record<string, string> = {};
      let wDict: Record<string, string> = {};
      let rDict: Record<string, string> = {};

      if (mapRes.ok) {
        const mappings = await mapRes.json();
        mappings.forEach((m: any) => {
          const cleanKey = String(m.originalName).toLowerCase().replace(/\s+/g, " ").trim();
          if (m.category === "Parameter") pDict[cleanKey] = m.shortName;
          if (m.category === "Ward") wDict[cleanKey] = m.shortName;
          if (m.category === "Result") rDict[cleanKey] = m.shortName;
        });
        setParamDict(pDict);
        setWardDict(wDict);
        setResultDict(rDict);
      }

      if (dbRes.ok) {
        const data = await dbRes.json();
        const mappedData = data.map((dbRow: any) => {
          
          let cleanedParam = dbRow.parameterName ? String(dbRow.parameterName).toLowerCase().replace(/\s+/g, " ").trim() : "";
          let isValidParameter = false;
          let finalParamName = dbRow.parameterName;

          // Check if it exists in dictionary either as an original name or already a short name
          if (cleanedParam) {
            if (pDict[cleanedParam]) {
              isValidParameter = true;
              finalParamName = pDict[cleanedParam];
            } else {
              const matchedShort = Object.values(pDict).find(p => p.toLowerCase().replace(/\s+/g, " ").trim() === cleanedParam);
              if (matchedShort) {
                isValidParameter = true;
                finalParamName = matchedShort;
              }
            }
          }

          // STRICT FILTER: Skip loading this row entirely if it's not in the dictionary!
          if (!isValidParameter) return null;

          return {
            id: dbRow.id,
            "Date": dbRow.resultDate || "-",
            "Sl. No.": dbRow.slNo,
            "UMR NO": dbRow.umrNo,
            "Patient Name": dbRow.patientName,
            "Age": dbRow.age,
            "Gender": dbRow.gender,
            "Admn No": dbRow.admnNo,
            "Bill No": dbRow.billNo,
            "Parameter Name": finalParamName,
            "Result Value": dbRow.resultValue,
            "Ward": dbRow.ward || "-", 
            _hiddenId: dbRow.id 
          };
        }).filter(Boolean); // Drops all nulls (unknown parameters)

        setMasterData(mappedData);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDirectory = async () => {
    try {
      const res = await fetch('/api/records?type=database');
      if (res.ok) {
        const data = await res.json();
        const lookup: Record<string, string> = {};
        
        data.forEach((row: any) => {
          if (row.umrNo) {
            const location = (row.ward && row.ward !== "-") ? row.ward : (row.department || "");
            if (location) {
              lookup[row.umrNo.toString().trim().toUpperCase()] = location;
            }
          }
        });
        
        setUmrLookup(lookup);
        return lookup;
      }
    } catch (err) {
      console.error("Failed to fetch UMR directory", err);
    }
    return {};
  };

  useEffect(() => {
    fetchRecords();
    fetchPatientDirectory(); 
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cleanupMenuRef.current && !cleanupMenuRef.current.contains(event.target as Node)) {
        setIsCleanupMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch('/api/records/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: cleanupHours })
      });
      
      if (res.ok) {
        setIsCleanupMenuOpen(false);
        await fetchRecords(); 
        alert(`Successfully deleted data older than ${cleanupHours} hours.`);
      } else {
        alert("Cleanup failed. Please check backend configuration.");
      }
    } catch (error) {
      console.error(error);
      alert("Error reaching cleanup API.");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSyncWards = async () => {
    if (masterData.length === 0) return alert("No data in the workspace to sync.");
    
    setIsSyncing(true);
    try {
      const latestLookup = await fetchPatientDirectory();
      let updatedCount = 0;

      setMasterData(prevData => {
        const newData = prevData.map(row => {
          const umrNo = row["UMR NO"]?.toString().trim().toUpperCase();
          if (umrNo && latestLookup[umrNo]) {
            let assignedWard = latestLookup[umrNo];
            
            const cleanWard = assignedWard.replace(/\s+/g, " ").trim().toLowerCase();
            if (wardDict[cleanWard]) assignedWard = wardDict[cleanWard];

            if (row["Ward"] !== assignedWard) {
              updatedCount++;
              return { ...row, "Ward": assignedWard };
            }
          }
          return row;
        });
        
        setTimeout(() => alert(`Sync Complete! Automatically updated the Ward/Department for ${updatedCount} records.`), 100);
        return newData;
      });

    } catch (error) {
      alert("An error occurred while syncing with the database.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsParsing(true);
    const uploadedFiles = Array.from(e.target.files);
    let newRows: any[] = [];
    
    let skippedCount = 0; 
    const missingParams = new Set<string>(); 
    
    for (const file of uploadedFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();

        if (file.name.endsWith('.csv')) {
          await workbook.csv.read(buffer as any);
        } else {
          await workbook.xlsx.load(buffer);
        }

        const worksheet = workbook.worksheets[0];
        const headerMap = new Map<number, string>();
        
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              const rawHeader = cell.value?.toString().trim() || "";
              const matchedColumn = ALLOWED_COLUMNS.find(
                col => col.toLowerCase() === rawHeader.toLowerCase() || 
                      (col === "Ward" && rawHeader.toLowerCase() === "admitted ward") ||
                      (col === "Date" && rawHeader.toLowerCase() === "result dt")
              );
              if (matchedColumn) headerMap.set(colNumber, matchedColumn);
            });
          } else {
            const currentRow: any = {};
            let hasValidData = false;

            row.eachCell((cell, colNumber) => {
              const mappedHeader = headerMap.get(colNumber);
              if (mappedHeader) {
                let cellValue = cell.value;
                let finalValStr = "";

                if (mappedHeader === "Date" && cellValue != null) {
                  let rawDateVal = cellValue;
                  if (typeof cellValue === 'object' && 'result' in cellValue) {
                    rawDateVal = (cellValue as any).result;
                  }

                  if (rawDateVal instanceof Date) {
                    const day = String(rawDateVal.getUTCDate()).padStart(2, '0');
                    const month = String(rawDateVal.getUTCMonth() + 1).padStart(2, '0');
                    const year = rawDateVal.getUTCFullYear();
                    finalValStr = `${day}-${month}-${year}`;
                  } else if (rawDateVal != null) {
                    finalValStr = rawDateVal.toString().split(' ')[0].split('T')[0];
                  }
                } else {
                  finalValStr = cellValue?.toString() || "";
                }

                currentRow[mappedHeader] = finalValStr;
                hasValidData = true;
              }
            });

            if (hasValidData) {
              const umrNo = currentRow["UMR NO"]?.toString().trim().toUpperCase();
              
              if (umrNo && umrLookup[umrNo]) {
                let assignedWard = umrLookup[umrNo];
                const cleanWard = assignedWard.replace(/\s+/g, " ").trim().toLowerCase();
                if (wardDict[cleanWard]) assignedWard = wardDict[cleanWard];
                currentRow["Ward"] = assignedWard;
              }

              if (currentRow["Result Value"]) {
                const cleanResult = currentRow["Result Value"].toString().replace(/\s+/g, " ").trim().toLowerCase();
                if (resultDict[cleanResult]) currentRow["Result Value"] = resultDict[cleanResult];
              }

              if (currentRow["Parameter Name"]) {
                const originalParam = currentRow["Parameter Name"].toString();
                const normalizedKey = originalParam.replace(/\s+/g, " ").trim().toLowerCase();
                
                if (paramDict[normalizedKey]) {
                  currentRow["Parameter Name"] = paramDict[normalizedKey];
                  currentRow._hiddenId = Math.random().toString(36).substr(2, 9);
                  newRows.push(currentRow);
                } else {
                  skippedCount++; 
                  missingParams.add(originalParam); 
                }
              }
            }
          }
        });
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error);
      }
    }

    if (skippedCount > 0) {
      const missingList = Array.from(missingParams);
      console.warn("🚨 HERE ARE THE MISSING PARAMETER NAMES:", missingList);
      setTimeout(() => alert(`Upload Complete! Automatically ignored ${skippedCount} unknown parameters that were not in your Dictionary.`), 100);
    }

    setMasterData((prev) => [...newRows, ...prev]);
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveToDatabase = async () => {
    const unsavedRecords = masterData.filter(r => !r.id);
    if (unsavedRecords.length === 0) return alert("No new records to save.");

    setIsSaving(true);
    
    const payload = unsavedRecords.map(row => {
      const mappedRow: any = {};
      Object.keys(dbKeyMap).forEach(displayKey => {
        mappedRow[dbKeyMap[displayKey]] = row[displayKey] || "";
      });
      return mappedRow;
    });

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: payload })
      });

      if (res.ok) {
        alert("Saved to Database successfully!");
        fetchRecords();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWipeDatabase = async () => {
    if (!confirm("⚠️ WARNING: Are you sure you want to completely wipe ALL Result Bank records? The main Database will NOT be affected.")) return;
    
    try {
      const res = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true, type: 'result-bank' }) 
      });
      
      if (res.ok) {
        alert("Success: Result Bank records have been securely wiped.");
        fetchRecords(); 
      } else {
        alert("Failed to wipe the Result Bank.");
      }
    } catch (error) {
      alert("Network error while trying to delete.");
    }
  };

  const handleClearData = () => {
    if (confirm("Clear local unsaved data? (Saved records will remain)")) {
       setMasterData(prev => prev.filter(r => r.id));
    }
  };

  const baseFilteredData = masterData.filter(row => {
    const hasAdmnNo = row["Admn No"] && row["Admn No"].toString().trim() !== "";
    if (patientType === "IP") return hasAdmnNo;
    if (patientType === "OP") return !hasAdmnNo;
    return true;
  });

  const displayData = Object.values(baseFilteredData.reduce((acc, row) => {
    const key = row["Bill No"] && row["Bill No"].trim() !== "" ? row["Bill No"].trim() : `ungrouped-${row._hiddenId}`;
    
    let combo = "";
    if (row["Parameter Name"] && row["Result Value"]) {
      combo = `${row["Parameter Name"]}-${row["Result Value"]}`;
    } else if (row["Parameter Name"]) {
      combo = row["Parameter Name"];
    } else if (row["Result Value"]) {
      combo = row["Result Value"];
    }
    
    if (!acc[key]) {
      acc[key] = { ...row };
      acc[key]["Test Results"] = combo;
    } else {
      if (combo) {
        acc[key]["Test Results"] = acc[key]["Test Results"] ? `${acc[key]["Test Results"]}, ${combo}` : combo;
      }
    }
    return acc;
  }, {} as Record<string, any>));

  const displayHeaders = masterHeaders
    .filter(h => h !== "Parameter Name" && h !== "Result Value")
    .concat(["Test Results"]);

  const handleDownloadMaster = async () => {
    if (displayData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${patientType}_Consolidated`);

    worksheet.addRow(displayHeaders);

    displayData.forEach((dataObj: any) => {
      const rowArr = displayHeaders.map(header => dataObj[header] || "");
      worksheet.addRow(rowArr);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grouped_${patientType}_Data_${new Date().getTime()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 min-h-screen relative">
      
      {/* --- SINGLE-LINE TOP TOOLBAR --- */}
      <div className="mb-2 flex flex-nowrap justify-between items-center bg-white p-1.5 border border-slate-300 rounded shadow-sm overflow-visible whitespace-nowrap">
        
        {/* Buttons Group */}
        <div className="flex items-center space-x-1.5 shrink-0 relative">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" multiple />
          <button onClick={() => fileInputRef.current?.click()} disabled={isParsing} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] flex items-center rounded-sm font-medium transition-colors">
            <Upload className="h-3 w-3 mr-1" /> {isParsing ? 'Extracting...' : 'Add Data'}
          </button>

          <button onClick={handleSyncWards} disabled={isSyncing || masterData.length === 0} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] flex items-center rounded-sm font-medium transition-colors">
            <Database className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-pulse' : ''}`} /> 
            {isSyncing ? 'Syncing...' : 'Sync Wards'}
          </button>
          
          {masterData.some(r => !r.id) && (
             <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-sm flex items-center shadow-sm transition-colors">
               <Save className="h-3 w-3 mr-1" /> {isSaving ? 'Saving...' : 'Save DB'}
             </button>
          )}
          
          <button onClick={handleDownloadMaster} disabled={displayData.length === 0} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 text-[10px] hover:bg-slate-100 flex items-center rounded-sm transition-colors disabled:opacity-50">
            <Download className="h-3 w-3 mr-1" /> Export Grouped
          </button>
          
          <button onClick={() => { fetchRecords(); fetchPatientDirectory(); }} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm shadow-sm transition-colors" title="Refresh Database">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {masterData.some(r => !r.id) && (
            <button onClick={handleClearData} className="px-2 py-1 bg-white border border-slate-300 text-slate-600 text-[10px] hover:bg-slate-50 flex items-center rounded-sm transition-colors" title="Clear Unsaved File Data">
              <Trash2 className="h-3 w-3" />
            </button>
          )}

          {masterData.some(r => r.id) && (
            <div className="relative flex items-center" ref={cleanupMenuRef}>
              <button 
                onClick={() => setIsCleanupMenuOpen(!isCleanupMenuOpen)} 
                className={`ml-1 px-2 py-1 border text-[10px] font-bold flex items-center rounded-sm transition-colors shadow-sm ${isCleanupMenuOpen ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`} 
                title="Delete old records"
              >
                <Clock className="h-3 w-3 mr-1" /> Cleanup
              </button>
              
              {isCleanupMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-[260px] bg-white border border-slate-200 rounded shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-[10px] font-bold text-orange-600 uppercase mb-2 border-b border-slate-100 pb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Database Cleanup
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mb-3 leading-tight whitespace-normal">
                    Permanently delete old records to save space. This cannot be undone.
                  </p>
                  
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Delete Older Than:
                    </label>
                    <select 
                      value={cleanupHours}
                      onChange={(e) => setCleanupHours(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded py-1.5 px-2 text-[10px] font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={48}>48 Hours</option>
                      <option value={72}>72 Hours (3 Days)</option>
                      <option value={168}>168 Hours (7 Days)</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCleanupMenuOpen(false)}
                      className="flex-1 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-sm shadow-sm font-bold text-[10px] hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeCleanup}
                      disabled={isCleaning}
                      className="flex-1 py-1.5 bg-orange-600 text-white rounded-sm shadow-sm font-bold text-[10px] hover:bg-orange-700 transition-colors flex justify-center items-center disabled:opacity-50"
                    >
                      {isCleaning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      {isCleaning ? 'Wait...' : 'Clean Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {masterData.some(r => r.id) && (
            <button onClick={handleWipeDatabase} className="ml-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold hover:bg-red-100 flex items-center rounded-sm transition-colors shadow-sm" title="Delete all Result Bank records">
              <AlertTriangle className="h-3 w-3 mr-1" /> Wipe DB
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-medium shrink-0 ml-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shadow-sm">
            <span className="font-semibold text-slate-600 border-r border-slate-200 pr-2">Filter:</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="patientType" value="Both" checked={patientType === "Both"} onChange={() => setPatientType("Both")} className="accent-blue-600" />
              <span className={patientType === "Both" ? "text-blue-700 font-bold" : "text-slate-600"}>Both</span>
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
              placeholder="Search data..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-5 pr-2 py-1 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 w-32 text-black" 
            />
          </div>
          
          <span>Unique Bills: <strong className="text-blue-950">{displayData.length.toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm relative z-0">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 shadow-sm bg-slate-800 text-slate-100">
            <tr>
              <th className="px-2 py-2 font-semibold w-16 text-center">Status</th>
              {displayHeaders.map((header, i) => (
                <th key={i} className="px-2 py-2 font-semibold whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={displayHeaders.length + 1} className="py-12 text-center text-slate-500 font-medium">Loading valid records from database...</td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={displayHeaders.length + 1} className="py-12 text-center">
                  <Table className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-50" />
                  <p className="text-sm font-medium text-slate-500">Workspace Empty</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a file to extract specific medical data columns.</p>
                </td>
              </tr>
            ) : (
              displayData.slice(0, 1000).map((row: any, rowIndex) => (
                <tr key={rowIndex} className={`hover:bg-blue-50 transition-none ${!row.id ? 'bg-yellow-50' : ''}`}>
                  <td className="border border-slate-200 px-2 py-1.5 text-center select-none">
                    {row.id ? <span className="text-emerald-600 font-bold">Saved</span> : <span className="text-yellow-600 font-bold">New</span>}
                  </td>
                  {displayHeaders.map((header, colIndex) => (
                    <td key={colIndex} className="border border-slate-200 px-2 py-1.5 truncate max-w-[200px] text-slate-800 font-medium" title={row[header]}>
                      {row[header] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {displayData.length > 1000 && (
        <div className="mt-1 text-center text-[10px] text-slate-500 font-medium">
          Showing first 1,000 unique bills. Export to view all {displayData.length.toLocaleString()}.
        </div>
      )}
    </div>
  );
}