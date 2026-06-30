"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Printer, RefreshCw, Table, Settings2, Download } from "lucide-react";
import DateRangeFilter from "../components/DateRangeFilter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- TEXT CLEANER ENGINE ---
const cleanResultText = (text: any) => {
  if (!text || typeof text !== 'string') return text;
  
  if (/Feb 01 \d{4}/.test(text)) return "1-2";
  if (/Mar 02 \d{4}/.test(text)) return "2-3";
  if (/Apr 03 \d{4}/.test(text)) return "3-4";
  if (/May 03 \d{4}/.test(text)) return "3-5";
  if (/Aug 06 \d{4}/.test(text)) return "6-8";

  return text
    .replace(/minus;/gi, "-")
    .replace(/&minus;/gi, "-")
    .replace(/plus;/gi, "+")
    .replace(/&plus;/gi, "+")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .trim();
};

// --- AGE & GENDER FORMATTER ---
const formatAgeSex = (age: any, gender: any) => {
  let a = String(age || "-").trim();
  let g = String(gender || "-").trim();

  if (a !== "-") {
    a = a.replace(/years?|yrs?/gi, "Y")
         .replace(/months?|mths?/gi, "M")
         .replace(/days?/gi, "D")
         .replace(/\s+/g, ""); 
  }

  if (g !== "-") {
    const gl = g.toLowerCase();
    if (gl === "male" || gl === "m") g = "M";
    else if (gl === "female" || gl === "f") g = "F";
    else g = g.charAt(0).toUpperCase(); 
  }

  if (a === "-" && (g === "-" || g === "")) return "-";
  return `${a}/${g}`; 
};

const MASTER_COLUMNS = [
  "Date", "UMR NO", "Patient Name", "Age/Sex", "Admn No", "Bill No", "Ward", "Service Group", "Test Results"
];

export default function PrintBoxPage() {
  const [masterData, setMasterData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [patientType, setPatientType] = useState<"All" | "IP" | "OP" | "EMD">("All");
  const [selectedServiceGroup, setSelectedServiceGroup] = useState<string>("All");
  const [reportStatus, setReportStatus] = useState<"All" | "Completed" | "Pending" | "Stag">("Stag");
  
  const [dateRange, setDateRange] = useState<{ from: Date | null, to: Date | null, label: string }>({
    from: null,
    to: null,
    label: 'All Time'
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(MASTER_COLUMNS);
  const [tempColumns, setTempColumns] = useState<string[]>(MASTER_COLUMNS);
  
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false); 
  const [markAsCompletedCheck, setMarkAsCompletedCheck] = useState(false);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCols = localStorage.getItem("printBoxColumns");
    if (savedCols) {
      try {
        let parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed.filter((c: string) => c !== "Age" && c !== "Gender");
          const missingNewCols = ["Age/Sex"].filter(c => !parsed.includes(c));
          const updatedCols = [...parsed, ...missingNewCols];
          
          setVisibleColumns(updatedCols);
          setTempColumns(updatedCols);
        }
      } catch (e) {
        console.error("Failed to parse saved columns");
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
        setTempColumns(visibleColumns);
      }
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visibleColumns]);

  const handleSaveColumns = () => {
    if (tempColumns.length === 0) {
      alert("Please select at least one column to display.");
      return;
    }
    const sortedSelectedCols = MASTER_COLUMNS.filter(col => tempColumns.includes(col));
    setVisibleColumns(sortedSelectedCols);
    localStorage.setItem("printBoxColumns", JSON.stringify(sortedSelectedCols));
    setIsColumnMenuOpen(false);
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const [res, dbRes, mapRes] = await Promise.all([
        fetch('/api/records'),
        fetch('/api/records?type=database'),
        fetch('/api/mappings').catch(() => null)
      ]);

      let resultsData = [];
      if (res.ok) resultsData = await res.json();

      let dbData = [];
      if (dbRes.ok) dbData = await dbRes.json();

      let mappingsData = [];
      if (mapRes && mapRes.ok) mappingsData = await mapRes.json();

      // --- ADVANCED DICTIONARY WITH SEQUENCE & DEPARTMENTS ---
      const paramDict: Record<string, { short: string, dept: string, seq: number }> = {};
      
      mappingsData.forEach((m: any) => {
        if (m.category === "Parameter" && m.originalName && m.shortName) {
          const cleanKey = cleanResultText(String(m.originalName)).toLowerCase().replace(/\s+/g, '');
          paramDict[cleanKey] = {
            short: String(m.shortName).trim(),
            dept: m.department || "Unknown",
            seq: m.sequence ? Number(m.sequence) : 9999
          };
        }
      });

      const umrPatientInfo: Record<string, { isIP: boolean, admnNo: string, age: string, gender: string }> = {};
      dbData.forEach((dbRow: any) => {
        if (dbRow.umrNo) {
          const isIpRecord = dbRow.ward && dbRow.ward.trim() !== "" && dbRow.ward.trim() !== "-";
          umrPatientInfo[String(dbRow.umrNo).trim().toUpperCase()] = {
            isIP: isIpRecord,
            admnNo: isIpRecord ? dbRow.admnNo : "-",
            age: dbRow.age || "-",
            gender: dbRow.gender || "-"
          };
        }
      });

      const mappedResults = resultsData.map((row: any) => {
        let cleanedParam = cleanResultText(row.parameterName || "");
        let cleanedVal = cleanResultText(row.resultValue || "");

        if (!cleanedParam) return null;

        const pKey = cleanedParam.toLowerCase().replace(/\s+/g, '');
        
        let foundInDictionary = false;
        let finalParam = cleanedParam;
        let finalDept = "Unknown";
        let finalSeq = 9999;

        if (paramDict[pKey]) {
          foundInDictionary = true;
          finalParam = paramDict[pKey].short;
          finalDept = paramDict[pKey].dept;
          finalSeq = paramDict[pKey].seq;
        } else {
          const matchedEntry = Object.values(paramDict).find(p => p.short.toLowerCase().replace(/\s+/g, '') === pKey);
          if (matchedEntry) {
            foundInDictionary = true;
            finalParam = matchedEntry.short;
            finalDept = matchedEntry.dept;
            finalSeq = matchedEntry.seq;
          }
        }

        // STRICT FILTER: If it is NOT in the dictionary, drop it entirely!
        if (!foundInDictionary) return null;

        row.parameterName = finalParam;
        row.resultValue = cleanedVal;
        row._department = finalDept;
        row._sequence = finalSeq;

        // Patient Type Logic
        let isIP = false;
        const umr = String(row.umrNo || "").trim().toUpperCase();
        
        if (umr && umrPatientInfo[umr]) {
          isIP = umrPatientInfo[umr].isIP;
          if (isIP && (!row.admnNo || row.admnNo === "-")) {
            row.admnNo = umrPatientInfo[umr].admnNo;
          }
          if (!row.age || row.age === "-") row.age = umrPatientInfo[umr].age;
          if (!row.gender || row.gender === "-") row.gender = umrPatientInfo[umr].gender;
        } else {
          const admnVal = String(row.admnNo || "").trim().toUpperCase();
          isIP = admnVal !== "" && admnVal !== "-" && admnVal !== "NULL" && !admnVal.startsWith("TEMP");
        }
        
        let pType = isIP ? "IP" : "OP";
        if (String(row.ward || "").trim().toUpperCase() === "ER") {
          pType = "EMD";
        }
        
        row._patientType = pType;

        return row;
      }).filter(Boolean);

      setMasterData(mappedResults);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const generateGroupedRows = () => {
    const groups: Record<string, any> = {};

    masterData.forEach((row: any) => {
      if (!row.parameterName) return;

      if (dateRange.from || dateRange.to) {
        if (!row.resultDate) return;
        const rDate = new Date(row.resultDate);
        if (!isNaN(rDate.getTime())) {
          rDate.setHours(0, 0, 0, 0);
          if (dateRange.from) {
            const fromDate = new Date(dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            if (rDate < fromDate) return;
          }
          if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(0, 0, 0, 0);
            if (rDate > toDate) return;
          }
        }
      }

      const pType = row._patientType;
      if (patientType !== "All" && pType !== patientType) return;

      const billKey = row.billNo && row.billNo !== "-" ? row.billNo : `UMR-${row.umrNo}`;
      const serviceGroup = row._department;
      
      const rDateString = row.resultDate && row.resultDate !== "-" ? row.resultDate : "Unknown Date";
      const uniqueGroupKey = `${billKey}_${serviceGroup}_${rDateString}`;
      
      const rowTime = new Date(row.createdAt || row.resultDate || Date.now()).getTime();

      if (!groups[uniqueGroupKey]) {
        groups[uniqueGroupKey] = {
          rawIds: new Set(),
          testsMap: new Map(), 
          
          minTime: rowTime,
          maxTime: rowTime,
          uploadCount: row.uploadCount || 1,
          isPrinted: true, 

          "Date": rDateString, 
          "UMR NO": row.umrNo || "-",
          "Patient Name": row.patientName || "-",
          "Age/Sex": formatAgeSex(row.age, row.gender),
          "Admn No": row.admnNo || "-",
          "Bill No": row.billNo || "-",
          "Ward": row.ward || "-",
          "Service Group": serviceGroup,
          _rawSearchData: `${row.patientName} ${row.umrNo} ${row.billNo} ${row.ward} ${serviceGroup}`.toLowerCase(),
          _patientType: row._patientType
        };
      }

      const group = groups[uniqueGroupKey];

      if (row.isPrinted !== true) {
        group.isPrinted = false;
      }

      if (rowTime < group.minTime) group.minTime = rowTime;
      if (rowTime > group.maxTime) group.maxTime = rowTime;
      if (row.uploadCount) group.uploadCount = Math.max(group.uploadCount, row.uploadCount);

      group.testsMap.set(row.parameterName, { val: row.resultValue, seq: row._sequence });
      group.rawIds.add(row.id);
    });

    const currentTime = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const processedRows = Object.values(groups).map((group: any) => {
      
      const sortedTests = Array.from(group.testsMap.entries())
        .sort((a: any, b: any) => a[1].seq - b[1].seq)
        .map(([param, data]: any) => `${param}-${data.val}`);
      
      const combo = sortedTests.join(", ");

      let calculatedStatus = "Stag";

      if (group.isPrinted) {
        calculatedStatus = "Completed";
      } else {
        const timeSinceFirstUpload = currentTime - group.minTime;
        const hasReuploaded = (group.maxTime - group.minTime > 60000) || (group.uploadCount > 1);

        if (timeSinceFirstUpload >= ONE_HOUR_MS && hasReuploaded) {
          calculatedStatus = "Pending";
        } else {
          calculatedStatus = "Stag";
        }
      }

      return {
        ...group,
        "Test Results": combo,
        rawIds: Array.from(group.rawIds),
        _status: calculatedStatus
      };
    });

    return processedRows.filter((row: any) => {
      if (reportStatus !== "All" && row._status !== reportStatus) return false;
      if (selectedServiceGroup !== "All" && row["Service Group"] !== selectedServiceGroup) return false;
      return row._rawSearchData.includes(searchTerm.toLowerCase()) ||
             row["Test Results"].toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const displayData = generateGroupedRows();

  const printGroups = displayData.reduce((acc, row) => {
    const pType = row._patientType || "OP";
    const sGroup = row["Service Group"] || "Uncategorized";
    const rDate = row["Date"] || "Unknown Date";

    if (!acc[pType]) acc[pType] = {};
    if (!acc[pType][sGroup]) acc[pType][sGroup] = {};
    if (!acc[pType][sGroup][rDate]) acc[pType][sGroup][rDate] = [];

    acc[pType][sGroup][rDate].push(row);
    return acc;
  }, {} as Record<string, Record<string, Record<string, any[]>>>);

  const createDocument = () => {
    if (displayData.length === 0) return null;

    const doc = new jsPDF('landscape');
    let isFirstPage = true;

    Object.entries(printGroups).forEach(([pType, sGroups]) => {
      Object.entries(sGroups as Record<string, Record<string, any[]>>).forEach(([sGroup, dateGroups]) => {
        Object.entries(dateGroups).forEach(([rDate, rows]) => {
          
          if (!isFirstPage) doc.addPage();
          isFirstPage = false;

          const tableData = rows.map(row => visibleColumns.map(col => row[col] || "-"));

          autoTable(doc, {
            startY: 22,
            head: [visibleColumns],
            body: tableData,
            theme: 'grid',
            styles: { cellPadding: 1.2, lineColor: [200, 200, 200], lineWidth: 0.1 },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7, fontStyle: 'bold' },
            bodyStyles: { fontSize: 6, textColor: [51, 65, 85] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 22, left: 10, right: 10, bottom: 15 }, 
            didDrawPage: function (data) {
              doc.setFontSize(14);
              doc.setTextColor(30, 58, 138); 
              doc.setFont("helvetica", 'bold'); 
              const typeLabel = pType === "IP" ? "Inpatient (IP)" : pType === "EMD" ? "Emergency (EMD)" : "Outpatient (OP)";
              doc.text(`${sGroup} Department - ${typeLabel}`, 10, 14);

              // 1. CHANGED: Combine Date and Page Number in the top right corner!
              const currentPage = (doc as any).internal.getNumberOfPages();
              const infoText = `Date: ${rDate}   |   Page ${currentPage}`;
              
              doc.setFontSize(10);
              doc.setTextColor(100, 116, 139); 
              doc.setFont("helvetica", 'bold');
              const pageWidth = doc.internal.pageSize.getWidth();
              doc.text(infoText, pageWidth - 10 - doc.getTextWidth(infoText), 14);

              doc.setDrawColor(200, 200, 200); 
              doc.setLineWidth(0.5);
              doc.line(10, 17, pageWidth - 10, 17);
              
              // 2. CHANGED: Completely removed the old page number code from the bottom.
            }
          });
        });
      });
    });

    return doc;
  };

  const processPrintAction = async (type: 'print' | 'pdf') => {
    setIsPrintMenuOpen(false); 

    const doc = createDocument();
    if (doc) {
      if (type === 'pdf') {
        doc.save(`Consolidated_Report_${new Date().getTime()}.pdf`);
      } else {
        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      }
    }

    if (markAsCompletedCheck) {
      const idsToUpdate = displayData.flatMap(row => row.rawIds).filter(Boolean);
      
      if (idsToUpdate.length > 0) {
        try {
          setMasterData(prevData => prevData.map(row => {
            if (idsToUpdate.includes(row.id)) {
              return { ...row, isPrinted: true };
            }
            return row;
          }));

          await fetch('/api/records/mark-printed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsToUpdate })
          });

        } catch (error) {
          console.error("Failed to update database print status.", error);
        }
      }
    }
  };

  return (
    <div className="p-4 flex flex-col h-screen bg-slate-100 overflow-hidden print:h-auto print:bg-white print:p-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-hide { display: none !important; }
        }
      `}} />
      
      {/* --- HEADER 1: ACTIONS --- */}
      <div className="mb-2 flex flex-nowrap items-center bg-white p-1.5 border border-slate-300 rounded shadow-sm relative z-50 print-hide overflow-visible shrink-0">
        <div className="flex items-center space-x-1.5 shrink-0 pr-2 border-r border-slate-200">
          <div className="flex items-center text-blue-950 font-bold text-[10px] mr-1">
            <Table className="h-3 w-3 mr-1 text-teal-600" />
            <span className="hidden sm:inline">Print Box</span>
          </div>
          
          <div className="relative shrink-0 flex items-center" ref={printMenuRef}>
            <button 
              onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)} 
              disabled={displayData.length === 0} 
              className={`px-2 py-1 flex items-center rounded-sm font-medium transition-colors disabled:opacity-50 shadow-sm text-[10px] ${isPrintMenuOpen ? 'bg-slate-900 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
            >
              <Printer className="h-3 w-3 mr-1" /> Print Options
            </button>
            
            {isPrintMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-[260px] bg-white border border-slate-200 rounded shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Export & Status</div>
                
                <label className="flex items-start space-x-2 p-2 border border-slate-200 bg-slate-50 rounded cursor-pointer hover:bg-slate-100 transition-colors mb-2 group">
                  <div className="pt-[1px]">
                    <input
                      type="checkbox"
                      checked={markAsCompletedCheck}
                      onChange={(e) => setMarkAsCompletedCheck(e.target.checked)}
                      className="h-3.5 w-3.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col whitespace-normal">
                    <span className="text-[10.5px] font-bold text-slate-800 group-hover:text-teal-800 transition-colors leading-tight">
                      Mark as Printed (Completed)
                    </span>
                    <span className="text-[9.5px] text-slate-500 mt-1 leading-tight">
                      Moves these to the "Completed" tab after printing.
                    </span>
                  </div>
                </label>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => processPrintAction('print')}
                    className="flex-1 py-1.5 bg-slate-800 text-white rounded-sm shadow-sm font-bold text-[10px] hover:bg-slate-900 transition-colors flex justify-center items-center"
                  >
                    <Printer className="h-3 w-3 mr-1" /> Print
                  </button>
                  <button
                    onClick={() => processPrintAction('pdf')}
                    className="flex-1 py-1.5 bg-blue-700 text-white rounded-sm shadow-sm font-bold text-[10px] hover:bg-blue-800 transition-colors flex justify-center items-center"
                  >
                    <Download className="h-3 w-3 mr-1" /> PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button onClick={fetchRecords} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm shadow-sm transition-colors hover:bg-slate-50 shrink-0 flex items-center justify-center">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* --- HEADER 2: FILTERS & SEARCH --- */}
      <div className="mb-2 flex items-center justify-between bg-white p-1.5 border border-slate-300 rounded shadow-sm relative z-40 print-hide overflow-visible shrink-0">
        
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-medium shrink-0">
          <div className="relative shrink-0 flex items-center" ref={colMenuRef}>
            <button onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} className={`flex items-center justify-center space-x-1 border rounded-sm px-2 py-1 shadow-sm transition-all min-w-[50px] ${isColumnMenuOpen ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
              <Settings2 size={12} className={isColumnMenuOpen ? 'text-teal-600' : 'text-slate-500'} />
              <span className="font-semibold text-[10px]">Cols</span>
            </button>
            {isColumnMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Customize</div>
                <div className="flex flex-col gap-1 mb-3 max-h-48 overflow-y-auto pr-1">
                  {MASTER_COLUMNS.map((col) => (
                    <label key={col} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors whitespace-normal">
                      <input type="checkbox" checked={tempColumns.includes(col)} onChange={(e) => { if (e.target.checked) setTempColumns([...tempColumns, col]); else setTempColumns(tempColumns.filter(c => c !== col)); }} className="accent-teal-600 h-3 w-3 shrink-0" />
                      <span className="text-[10px] font-medium text-slate-700">{col}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveColumns} className="w-full py-1 bg-teal-600 text-white text-[10px] font-bold rounded-sm shadow-sm hover:bg-teal-700 transition-colors">Save</button>
              </div>
            )}
          </div>
          
          <DateRangeFilter onFilterChange={(range: any) => setDateRange(range)} align="start" buttonClassName="flex items-center justify-between space-x-1 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shadow-sm hover:bg-slate-100 transition-all min-w-[75px] text-[10px]" />
          
          <select value={selectedServiceGroup} onChange={(e) => setSelectedServiceGroup(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 text-teal-700 font-bold focus:outline-none cursor-pointer outline-none shadow-sm shrink-0 w-[80px] text-[10px]">
            <option value="All">All Depts</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Haematology">Haematology</option>
            <option value="Clinical Pathology">Clinical Path</option>
            <option value="Serology">Serology</option>
          </select>
          
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shadow-sm shrink-0">
            {['All', 'IP', 'OP', 'EMD'].map(type => (
              <label key={type} className="flex items-center space-x-1 cursor-pointer">
                <input type="radio" name="ptype" checked={patientType === type} onChange={() => setPatientType(type as any)} className="accent-blue-600" />
                <span className={patientType === type ? "text-blue-700 font-bold" : "text-slate-600"}>{type}</span>
              </label>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shadow-sm shrink-0">
            {['All', 'Completed', 'Pending', 'Stag'].map(status => (
              <label key={status} className="flex items-center space-x-1 cursor-pointer">
                <input type="radio" name="rstatus" checked={reportStatus === status} onChange={() => setReportStatus(status as any)} className="accent-teal-600" />
                <span className={reportStatus === status ? "text-teal-700 font-bold" : "text-slate-600"}>{status === 'Completed' ? 'Comp' : status === 'Pending' ? 'Pend' : status}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="relative shrink-0 ml-3">
          <Search className="absolute left-1.5 top-1 h-3 w-3 text-slate-400" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-5 pr-2 py-1 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 w-32 text-black text-[10px]" />
        </div>

      </div>

      {/* --- SCROLLABLE DATA AREA --- */}
      <div className="bg-white border border-slate-300 flex-1 overflow-auto rounded shadow-sm relative z-0 print:border-none print:shadow-none print:overflow-visible">
        
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-medium print-hide">Loading mapped records...</div>
        ) : displayData.length === 0 ? (
          <div className="py-12 text-center print-hide">
            <Table className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-50" />
            <p className="text-sm font-medium text-slate-500">No Data Found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 print-hide p-4">
            {Object.entries(printGroups).map(([pType, sGroups]) => (
              <div key={pType}>
                <div className="flex flex-col gap-6">
                  {Object.entries(sGroups as Record<string, Record<string, any[]>>).map(([sGroup, dateGroups]) => (
                    <React.Fragment key={sGroup}>
                      {Object.entries(dateGroups).map(([rDate, rows]) => (
                        <div key={`${sGroup}-${rDate}`} className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                          
                          <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-teal-700 flex items-center uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mr-2"></span>
                              {sGroup} Department - {pType === "IP" ? "Inpatient (IP)" : pType === "EMD" ? "Emergency (EMD)" : "Outpatient (OP)"}
                            </h3>
                            <span className="text-[10px] text-slate-500 font-bold">Date: {rDate}</span>
                          </div>
                          
                          <table className="w-full text-left border-collapse text-[11px] relative">
                            <thead className="bg-slate-800 text-slate-100 sticky top-0 z-10 shadow-sm border-b-2 border-slate-600">
                              <tr>
                                {visibleColumns.map((header, i) => (
                                  <th key={i} className={`px-2 py-2 font-semibold whitespace-nowrap border-r border-slate-600 tracking-wide ${i === visibleColumns.length - 1 ? "border-r-0" : ""}`}>
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {rows.map((row: any, rowIndex: number) => (
                                <tr key={rowIndex} className="hover:bg-blue-50 transition-none">
                                  {visibleColumns.map((header, colIndex) => (
                                    <td key={colIndex} className={`border-r border-slate-200 px-2 py-1 max-w-[300px] text-slate-800 font-medium ${header === "Test Results" ? "whitespace-normal truncate" : "whitespace-nowrap"} ${colIndex === visibleColumns.length - 1 ? "border-r-0" : ""}`} title={row[header]}>
                                      {row[header] || "-"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="text-center text-[10px] text-slate-400 font-medium mt-4">
              Showing {displayData.length.toLocaleString()} total generated rows.
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}