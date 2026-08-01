"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Printer, Save, Users, Plus, X, PenTool, FileText, FileSpreadsheet, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { QRCodeSVG } from "qrcode.react";
import { toJpeg } from "html-to-image";

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const YEARS = [2024, 2025, 2026, 2027];

const isActuallyDefault = (val: any) => val === true || val === "true" || val === 1 || val === "1";

export default function RosterSheetPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const m = new URLSearchParams(window.location.search).get('month');
      if (m !== null) return parseInt(m);
    }
    return new Date().getMonth();
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const y = new URLSearchParams(window.location.search).get('year');
      if (y !== null) return parseInt(y);
    }
    return new Date().getFullYear();
  });
  const [selectedDept, setSelectedDept] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [authorisations, setAuthorisations] = useState<any[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<any[]>([]);
  const [globalShifts, setGlobalShifts] = useState<any[]>([]);
  const [orgSettings, setOrgSettings] = useState<{orgName: string, logoUrl: string, copyTo?: string[], showQrCode?: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSig, setSelectedSig] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ date: string, shift: string, displayDate: string } | null>(null);
  const [validationError, setValidationError] = useState<{ date: string, missingSnos: string, x: number, y: number } | null>(null);
  const [rdModalInfo, setRdModalInfo] = useState<{ id: string, realId: string, cellKey: string, isRd: boolean } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsViewMode(new URLSearchParams(window.location.search).get('view') === 'true');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [deptRes, staffRes, authRes, holidaysRes, shiftsRes, settingsRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/staff'),
          fetch('/api/authorisations'),
          fetch('/api/holidays'),
          fetch('/api/shifts'),
          fetch('/api/settings')
        ]);
        
        if (deptRes.ok) {
          const depts = await deptRes.json();
          setDepartments(depts);
          const params = new URLSearchParams(window.location.search);
          const d = params.get('dept');
          if (d && depts.find((dept: any) => dept.name === d)) {
            setSelectedDept(d);
          } else if (depts.length > 0) {
            setSelectedDept(depts[0].name);
          }
        }
        if (staffRes.ok) setStaffList(await staffRes.json());
        if (authRes.ok) setAuthorisations(await authRes.json());
        if (holidaysRes.ok) setPublicHolidays(await holidaysRes.json());
        if (shiftsRes.ok) setGlobalShifts(await shiftsRes.json());
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s && !s.error) setOrgSettings(s);
        }
      } catch (error) {
        console.error("Failed to fetch roster dependencies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    
    const fetchAssignments = async () => {
      const yearMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      try {
        const res = await fetch(`/api/roster?department=${selectedDept}&yearMonth=${yearMonth}`);
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        } else {
          setAssignments({});
        }
      } catch (error) {
        console.error("Failed to load assignments", error);
      }
    };
    
    fetchAssignments();
  }, [selectedDept, selectedMonth, selectedYear]);

  const sigOptions = useMemo(() => {
    return authorisations.filter(a => a.department === selectedDept && !isActuallyDefault(a.isDefault));
  }, [authorisations, selectedDept]);

  useEffect(() => {
    const deptAuth = authorisations.find(a => a.department === selectedDept && !isActuallyDefault(a.isDefault));
    if (deptAuth) {
      setSelectedSig(deptAuth.id);
    } else {
      setSelectedSig("");
    }
  }, [authorisations, selectedDept]);

  const defaultSig = useMemo(() => {
    return authorisations.find(a => a.department === selectedDept && isActuallyDefault(a.isDefault));
  }, [authorisations, selectedDept]);
  
  const dutySig = authorisations.find(a => a.id === selectedSig);

  const getHolidayForDay = (dateKey: string) => {
    return publicHolidays.find(h => h.date.startsWith(dateKey));
  };

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    const days = [];
    while (date.getMonth() === selectedMonth) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days.filter(d => {
      const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (fromDate && dKey < fromDate) return false;
      if (toDate && dKey > toDate) return false;
      return true;
    });
  }, [selectedMonth, selectedYear, fromDate, toDate]);

  const activeDeptObj = departments.find(d => d.name === selectedDept);
  
  const departmentShifts = useMemo(() => {
    let result = [];
    if (activeDeptObj && activeDeptObj.shiftTimings && Array.isArray(activeDeptObj.shiftTimings) && activeDeptObj.shiftTimings.length > 0) {
      result = [...activeDeptObj.shiftTimings]
        .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0))
        .map((deptShift: any) => {
          const globalObj = globalShifts.find((g: any) => g.name === deptShift.name);
          return globalObj ? { ...globalObj, sequence: deptShift.sequence } : null;
        })
        .filter(Boolean);
    } else {
      result = [...globalShifts].sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
    }

    // Deduplicate by name to fix any double "WO" entries from bad database state
    const seen = new Set();
    return result.filter((shift: any) => {
      if (seen.has(shift.name)) return false;
      seen.add(shift.name);
      return true;
    });
  }, [globalShifts, activeDeptObj]);

  const activeDeptStaff = staffList.filter(s => s.department === selectedDept && s.status === "Active");

  const sortAssignedIds = (ids: string[]) => {
    return [...ids].sort((a, b) => {
      const idA = a.startsWith("RD:") ? a.substring(3) : a;
      const idB = b.startsWith("RD:") ? b.substring(3) : b;
      const staffA = activeDeptStaff.find(s => s.empId === idA);
      const staffB = activeDeptStaff.find(s => s.empId === idB);
      const seqA = staffA?.sequence ?? 9999;
      const seqB = staffB?.sequence ?? 9999;
      return seqA - seqB;
    });
  };



  const openAssignmentModal = (e: React.MouseEvent, dateStr: string, shiftName: string, displayDate: string) => {
    if (isViewMode) return;
    setValidationError(null); 
    
    for (const day of daysInMonth) {
      const prevDateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      if (prevDateKey === dateStr) break; 

      const prevDisplayDate = day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const assignedOnPrevDay = new Set<string>();
      
      departmentShifts.forEach((shift: any) => {
        const key = `${prevDateKey}_${shift.name}`;
        (assignments[key] || []).forEach(empId => {
          const realId = empId.startsWith("RD:") ? empId.substring(3) : empId;
          assignedOnPrevDay.add(realId);
        });
      });

      const missingStaff = activeDeptStaff.filter(s => !assignedOnPrevDay.has(s.empId));

      if (missingStaff.length > 0) {
        const missingSnos = missingStaff.map(s => s.sequence || "-").join(', ');

        let popupX = e.clientX;
        let popupY = e.clientY + 15; 
        if (popupX > window.innerWidth - 220) popupX = window.innerWidth - 230; 
        if (popupY > window.innerHeight - 100) popupY = e.clientY - 90; 

        setValidationError({
          date: prevDisplayDate,
          missingSnos: missingSnos,
          x: popupX,
          y: popupY
        });
        return; 
      }
    }

    setActiveCell({ date: dateStr, shift: shiftName, displayDate });
    setIsModalOpen(true);
  };

  const toggleStaffAssignment = (empId: string) => {
    if (!activeCell) return;
    const key = `${activeCell.date}_${activeCell.shift}`;
    setAssignments(prev => {
      const current = prev[key] || [];
      if (current.includes(empId) || current.includes(`RD:${empId}`)) {
        return { ...prev, [key]: current.filter(id => id !== empId && id !== `RD:${empId}`) };
      } else {
        return { ...prev, [key]: [...current, empId] };
      }
    });
  };

  const saveToDatabase = async () => {
    const yearMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: selectedDept,
          yearMonth,
          assignments
        })
      });
      
      if (res.ok) {
        alert("Duty Roster saved successfully!");
      } else {
        alert("Failed to save roster.");
      }
    } catch (error) {
      console.error("Error saving roster:", error);
      alert("An error occurred while saving.");
    }
  };


  const exportToExcel = async () => {
    setIsExportOpen(false);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shift Roster");

    // Title rows
    worksheet.mergeCells('A1:J1');
    const sheetTitle = `${orgSettings?.orgName || "General Hospital"} - Duty Roster`;
    worksheet.getCell('A1').value = sheetTitle;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Shift Roster - ${MONTHS[selectedMonth]} ${selectedYear} (${selectedDept})`;
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    const headers = ["Date", "Weekday", ...departmentShifts.map((s: any) => {
      const gShift = globalShifts.find(gs => gs.name === s.name);
      return gShift && gShift.dailyTime ? gShift.dailyTime : s.name;
    })];
    
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 15;
    for (let i = 0; i < departmentShifts.length; i++) {
      worksheet.getColumn(i + 3).width = 25;
    }

    daysInMonth.forEach(day => {
      const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const isWeekend = day.getDay() === 0;
      const holiday = getHolidayForDay(dateKey);
      
      const rowData = [
        day.getDate().toString(),
        day.toLocaleDateString('en-US', { weekday: 'long' })
      ];
      
      departmentShifts.forEach((shift: any) => {
        const cellKey = `${dateKey}_${shift.name}`;
        const assignedIds = sortAssignedIds(assignments[cellKey] || []);
        const cellText = assignedIds.map((id: string) => {
          const isRd = id.startsWith("RD:");
          const realId = isRd ? id.substring(3) : id;
          const staff = activeDeptStaff.find(s => s.empId === realId);
          const seq = staff?.sequence || realId;
          return isRd ? `${seq}(RD)` : seq;
        }).join(', ');
        rowData.push(cellText);
      });

      const excelRow = worksheet.addRow(rowData);
      
      excelRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Color weekends/holidays
      if (holiday) {
        const argbColor = holiday.color.startsWith('#') ? holiday.color.replace('#', 'FF').toUpperCase() : 'FFFFEBEB';
        excelRow.eachCell((cell) => {
          cell.font = { color: { argb: 'FF000000' }, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
        });
      } else if (isWeekend) {
        excelRow.eachCell((cell) => {
          cell.font = { color: { argb: 'FFFF0000' }, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Shift_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const generatePDF = async (action: 'save' | 'print') => {
    setIsExportOpen(false);
    
    if (action === 'print') {
      handlePrint();
      return;
    }
    
    try {
      setIsExportingPDF(true);
      
      // Allow React to render print-only elements
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!printRef.current) return;
      
      const imgData = await toJpeg(printRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save(`Shift_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const clearSheet = () => {
    if (confirm("Are you sure you want to clear the entire roster for this month? This action cannot be undone.")) {
      setAssignments({});
    }
  };

  const handleToggleRd = () => {
    if (!rdModalInfo) return;
    const { id, realId, cellKey, isRd } = rdModalInfo;
    const newAssignedIds = [...(assignments[cellKey] || [])];
    const targetIndex = newAssignedIds.indexOf(id);
    if (targetIndex > -1) {
      if (isRd) {
        newAssignedIds[targetIndex] = realId; // remove RD: prefix
      } else {
        newAssignedIds[targetIndex] = `RD:${realId}`; // add RD: prefix
      }
      setAssignments({ ...assignments, [cellKey]: newAssignedIds });
    }
    setRdModalInfo(null);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Shift_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}`,
  });

  return (
    <div className="p-4 bg-slate-100 relative print:h-auto">
      
      {/* 
        PRINT STYLESHEET 
        This block forces the printer to use Landscape mode and print exact colors 
      */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
            zoom: 0.52;
          }
          /* Hide scrollbars during print */
          ::-webkit-scrollbar {
            display: none;
          }
          /* Ensure everything stays on one page */
          .print-container {
            page-break-inside: avoid;
          }
          .roster-table-container {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* CONTROLS */}
      <div className={`mb-3 flex flex-wrap items-center justify-between bg-white p-2 border border-slate-300 rounded shadow-sm gap-2 ${isExportingPDF || isViewMode ? 'hidden' : 'print:hidden'}`}>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Duty Person Signatory Selection */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="p-1 bg-indigo-50 rounded text-indigo-600 border border-indigo-100 hidden md:block">
              <PenTool className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden lg:block">Duty Sig:</span>
            <select 
              value={selectedSig} 
              onChange={(e) => setSelectedSig(e.target.value)}
              className="appearance-none h-8 bg-slate-50 border border-slate-300 rounded-sm px-1.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[90px] lg:w-[110px] truncate"
            >
              <option value="">- Select -</option>
              {sigOptions.map(a => <option key={a.id} value={a.id}>{a.personName}</option>)}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

          {/* Month/Year Selector */}
          <div className="flex items-center bg-slate-50 rounded-sm border border-slate-300 shadow-sm h-8 shrink-0">
            <button onClick={() => setSelectedMonth(p => p === 0 ? 11 : p - 1)} className="px-1.5 hover:bg-slate-200 text-slate-600 transition-colors h-full flex items-center">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center border-x border-slate-200 h-full">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="appearance-none bg-transparent pl-1.5 pr-1 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m.substring(0,3)}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="appearance-none bg-transparent pl-1 pr-1.5 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => setSelectedMonth(p => p === 11 ? 0 : p + 1)} className="px-1.5 hover:bg-slate-200 text-slate-600 transition-colors h-full flex items-center">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Date Range Selectors */}
          <div className="flex items-center gap-1 h-8 bg-slate-50 border border-slate-300 rounded-sm px-1.5 shadow-sm shrink-0">
            <span className="text-[9px] text-slate-500 font-bold uppercase mx-0.5 hidden sm:block">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="appearance-none bg-transparent py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[75px] sm:w-[85px]"
            />
            <span className="text-[9px] text-slate-500 font-bold uppercase mx-0.5 border-l border-slate-200 pl-1 hidden sm:block">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="appearance-none bg-transparent py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[75px] sm:w-[85px]"
            />
            {(fromDate || toDate) && (
              <button 
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-0.5"
                title="Clear range"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Department */}
          <div className="flex items-center bg-slate-50 rounded-sm border border-slate-300 shadow-sm px-1.5 h-8 shrink-0">
            <Users className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="appearance-none bg-transparent pr-4 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none w-[80px] lg:w-[100px] truncate">
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center justify-center gap-1 px-2 h-8 bg-white border border-slate-300 text-slate-700 rounded-sm font-bold text-[10px] hover:bg-slate-50 transition-colors shadow-sm hidden md:flex"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 shadow-lg rounded-sm py-1 z-50">
                <button 
                  onClick={() => generatePDF('save')}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-red-500" /> Export PDF
                </button>
                <button 
                  onClick={exportToExcel}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" /> Export Excel
                </button>
              </div>
            )}
          </div>
          <button onClick={clearSheet} className="flex items-center justify-center gap-1 px-2 h-8 bg-white border border-red-300 text-red-600 rounded-sm font-bold text-[10px] hover:bg-red-50 transition-colors shadow-sm">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button onClick={() => generatePDF('print')} className="flex items-center justify-center gap-1 px-2 h-8 bg-white border border-slate-300 text-slate-700 rounded-sm font-bold text-[10px] hover:bg-slate-50 transition-colors shadow-sm">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={saveToDatabase} className="flex items-center justify-center gap-1 px-3 h-8 bg-indigo-600 text-white rounded-sm font-bold text-[10px] hover:bg-indigo-700 transition-colors shadow-sm">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white p-4 print:p-0 print:pt-[20mm] print:px-[15mm] print:pb-[5mm] print-container">
        {/* PRINT-ONLY HEADER */}
        <div className={`${isExportingPDF ? 'block' : 'hidden print:block'} mb-6 shrink-0`}>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-4">
              {orgSettings?.logoUrl && (
                <img src={orgSettings.logoUrl} alt="Logo" className="h-24 w-auto" />
              )}
              <h1 className="text-3xl font-black text-slate-900 whitespace-nowrap">{orgSettings?.orgName || "General Hospital"}</h1>
            </div>
            <h2 className="text-lg font-bold text-slate-700 mt-2">Duty Roster - Shift Wise</h2>
          </div>
          <div className="flex justify-between items-center mt-4 border-b-2 border-slate-800 pb-2">
            <p className="font-bold text-slate-800">Department: {selectedDept || 'All'}</p>
            <p className="font-bold text-slate-800">Month: {MONTHS[selectedMonth]} {selectedYear}</p>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className={`bg-white ${isExportingPDF ? 'border-none shadow-none' : 'border border-slate-300 rounded shadow-sm relative print:border-none print:shadow-none'}`}>
        
        {/* REMOVED REDUNDANT PRINT HEADER */}

        {/* ROSTER TABLE */}
        <div className={`roster-table-container ${isExportingPDF ? 'overflow-visible' : 'overflow-auto'}`} style={!isExportingPDF ? { height: 'calc(100vh - 180px)' } : {}}>
          <table className="w-full text-sm border-collapse min-w-max">
            <thead className="bg-slate-800 text-slate-100 shadow-sm print-color-adjust-exact">
              <tr>
                <th className="border border-black print:border-slate-500 px-3 py-2 text-left font-bold uppercase tracking-wider text-[11px] print:text-[16px] w-24 sticky left-0 top-0 z-30 bg-slate-800">Date</th>
                <th className="border border-black print:border-slate-500 px-3 py-2 text-center font-bold uppercase tracking-wider text-[11px] print:text-[16px] w-32 sticky left-24 top-0 z-30 bg-slate-800">Day</th>
                
                {isLoading ? (
                  <th className="border border-black p-2 text-center text-[11px] sticky top-0 z-10 bg-slate-800">Loading Shifts...</th>
                ) : departmentShifts.length === 0 ? (
                  <th className="border border-black p-2 text-center text-[11px] text-orange-300 sticky top-0 z-10 bg-slate-800">No shifts mapped to {selectedDept}</th>
                ) : (
                  departmentShifts.map((shift: any) => {
                    const globalShift = globalShifts.find(s => s.name === shift.name);
                    const displayName = globalShift && globalShift.dailyTime ? globalShift.dailyTime : shift.name;
                    return (
                      <th key={shift.name} className="border border-slate-600 print:border-slate-400 p-2 text-center font-bold uppercase tracking-wider text-[11px] print:text-[14px] w-32 sticky top-0 z-10 bg-slate-800">
                        {displayName}
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 print:divide-slate-400">
              {daysInMonth.map(day => {
                const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const displayDate = day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const isWeekend = day.getDay() === 0;
                const holiday = getHolidayForDay(dateKey);
                
                let rowBgClass = 'bg-white';
                if (isWeekend && !holiday) rowBgClass = 'bg-red-50 print-color-adjust-exact';
                if (holiday) rowBgClass = 'print-color-adjust-exact';
                
                let textClass = 'text-slate-700';
                if (holiday) textClass = '';
                else if (isWeekend) textClass = 'text-red-700';
                
                const rowStyle = holiday ? { backgroundColor: holiday.color, color: '#000000' } : {};

                return (
                  <tr key={dateKey} className={`group transition-colors ${rowBgClass}`} style={rowStyle} title={holiday ? holiday.name : undefined}>
                    <td className={`p-2 px-3 print:py-1 print:px-2 border border-slate-200 print:border-black font-mono font-medium text-[11px] print:text-[16px] ${textClass} sticky left-0 z-10 ${rowBgClass}`} style={rowStyle}>
                      {displayDate}
                    </td>
                    <td className={`p-2 print:py-1 border border-slate-200 print:border-black text-center sticky left-24 z-10 ${rowBgClass}`} style={rowStyle}>
                      <span className={`text-[10px] print:text-[15px] font-bold uppercase ${textClass}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                    </td>
                    
                    {departmentShifts.map((shift: any) => {
                      const cellKey = `${dateKey}_${shift.name}`;
                      const assignedIds = sortAssignedIds(assignments[cellKey] || []);
                      
                      return (
                        <td key={shift.name} className="p-0 border border-slate-200 print:border-black relative h-12 print:h-[31px] align-middle hover:bg-blue-50 transition-colors cursor-pointer" onClick={(e) => openAssignmentModal(e, dateKey, shift.name, displayDate)} style={rowStyle}>
                          <div className="w-full h-full flex flex-wrap items-center justify-center p-1.5 print:p-0.5">
                            {assignedIds.length > 0 ? (
                              <div className="flex flex-wrap items-center justify-center gap-0.5 px-1">
                                {assignedIds.map((id, index) => {
                                  const isRd = id.startsWith("RD:");
                                  const realId = isRd ? id.substring(3) : id;
                                  const staff = activeDeptStaff.find(s => s.empId === realId);
                                  const isOffShift = shift.name.toUpperCase().includes("W/O") || 
                                                     shift.name.toUpperCase().includes("WO") || 
                                                     shift.name.toUpperCase().includes("OFF");

                                  return (
                                    <React.Fragment key={id}>
                                      {index > 0 && <span className="text-slate-500 font-bold print:text-[16px]">, </span>}
                                      <span 
                                        className={`font-bold text-[11px] print:text-[16px] ${isRd ? 'text-yellow-600' : isOffShift ? 'text-red-600' : 'text-slate-800'}`} 
                                        title={`${staff?.name}${isRd ? ' (Rest Day)' : ''}`}
                                        onClick={(e) => {
                                          if (isViewMode) return;
                                          if (isOffShift) {
                                            e.stopPropagation();
                                            setRdModalInfo({ id, realId, cellKey, isRd });
                                          }
                                        }}
                                        style={isOffShift ? { cursor: 'pointer' } : {}}
                                      >
                                        {staff?.sequence || realId}
                                      </span>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className={`opacity-0 group-hover:opacity-100 ${textClass} transform scale-75 transition-all print:hidden`}>
                                <Plus size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* STAFF INDEX TABLE */}
        <div className="px-4 py-4 mt-2 border-t border-slate-300 break-inside-avoid print:border-none">
          <h3 className="text-[11px] print:text-[16px] font-bold text-slate-800 uppercase tracking-wider mb-2">
            Staff Signatures & Reference ({selectedDept})
          </h3>
          {activeDeptStaff.length === 0 ? (
            <p className="text-[10px] text-slate-500">No active staff mapped.</p>
          ) : (
            <div className="flex flex-col">
              {(() => {
                const totalStaff = activeDeptStaff.length;
                const maxColumns = 8;
                
                const numRows = Math.ceil(totalStaff / maxColumns);
                const colsPerRow = Math.ceil(totalStaff / numRows);
                
                const sortedStaff = [...activeDeptStaff].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
                const chunks = [];
                
                for (let i = 0; i < totalStaff; i += colsPerRow) {
                  chunks.push(sortedStaff.slice(i, i + colsPerRow));
                }
                
                return chunks.map((chunk, chunkIdx) => (
                  <React.Fragment key={chunkIdx}>
                    <table className={`w-full text-[10px] print:text-[15px] border-collapse border border-slate-400 print:border-black table-fixed ${chunkIdx > 0 ? '-mt-[1px]' : ''}`}>
                      <tbody>
                        <tr>
                          <th className="border border-slate-400 print:border-black bg-slate-100 print:bg-slate-50 p-1.5 print:p-1 pl-2 text-left w-16 whitespace-nowrap text-slate-700 font-bold h-8 print:h-8">
                            Name
                          </th>
                          {chunk.map(staff => (
                            <td key={`name-${staff.id}`} className="border border-slate-400 print:border-black p-1.5 print:p-1 text-center leading-tight text-[10px] print:text-[15px] break-words h-8 print:h-8">
                              <span className="font-bold text-black">({staff.sequence || "-"})</span> <span className="font-medium text-slate-800">{staff.name}</span>
                            </td>
                          ))}
                          {Array.from({ length: colsPerRow - chunk.length }).map((_, i) => (
                            <td key={`empty-name-${chunkIdx}-${i}`} className="border border-slate-400 print:border-black p-1.5 print:p-0.5 h-8 print:h-5 bg-slate-50 print:bg-transparent"></td>
                          ))}
                        </tr>
                        <tr>
                          <th className="border border-slate-400 print:border-black bg-slate-100 print:bg-slate-50 p-1.5 print:p-1 pl-2 text-left w-16 whitespace-nowrap text-slate-700 font-bold h-8 print:h-8">
                            Sign
                          </th>
                          {chunk.map(staff => (
                            <td key={`sign-${staff.id}`} className="border border-slate-400 print:border-black p-1.5 print:p-1 h-8 print:h-8"></td>
                          ))}
                          {Array.from({ length: colsPerRow - chunk.length }).map((_, i) => (
                            <td key={`empty-sign-${chunkIdx}-${i}`} className="border border-slate-400 print:border-black p-1.5 print:p-0.5 h-8 print:h-5 bg-slate-50 print:bg-transparent"></td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </React.Fragment>
                ));
              })()}
            </div>
          )}
        </div>

        {/* FOOTER: SIGNATORIES */}
        <div className="px-6 py-6 border-t border-slate-300 print:border-none break-inside-avoid">
          <div className="flex justify-between items-end">
            
            <div className="flex items-end gap-12">
              {orgSettings?.copyTo && orgSettings.copyTo.some(c => c.trim() !== '') && (
                <div className="text-[10px] print:text-[14px] font-medium text-slate-700 leading-tight">
                  <div className="font-bold mb-1">Copy to:</div>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    {orgSettings.copyTo.filter(c => c.trim() !== '').map((copy, i) => (
                      <li key={i}>{copy}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {orgSettings?.showQrCode !== false && (
                <div className="w-24 flex flex-col items-center">
                  {isMounted && (
                    <QRCodeSVG value={`${window.location.origin}/roster/sheet?dept=${encodeURIComponent(selectedDept)}&month=${selectedMonth}&year=${selectedYear}&view=true`} size={100} />
                  )}
                  <span className="text-[8px] mt-1 text-slate-500 font-bold whitespace-nowrap">Scan for Digital Copy</span>
                </div>
              )}
            </div>

            <div className="flex gap-16">
              {defaultSig && (
                <div className="flex flex-col items-center text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 inline-block leading-tight min-w-[200px] text-[11px] print:text-[16px]">
                    {defaultSig.personName}
                  </div>
                </div>
                <div className="text-[10px] print:text-[14px] font-bold uppercase tracking-wider text-slate-900">
                  {defaultSig.designation}
                </div>
                <div className="text-[9px] print:text-[12px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                  {defaultSig.departmentTitle}
                </div>
              </div>
            )}

            {dutySig && (
              <div className="flex flex-col items-center text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 inline-block leading-tight min-w-[200px] text-[11px] print:text-[16px]">
                    {dutySig.personName}
                  </div>
                </div>
                <div className="text-[10px] print:text-[14px] font-bold uppercase tracking-wider text-slate-900">
                  {dutySig.designation}
                </div>
                <div className="text-[9px] print:text-[12px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                  {dutySig.departmentTitle}
                </div>
              </div>
            )}
            </div>
            
          </div>
        </div>
      </div>


        {/* PRINT-ONLY FOOTER WITH SIGNATURES */}
        <div className={`${isExportingPDF ? 'block mt-8' : 'hidden'} pb-4 pt-10 px-8 break-inside-avoid`}>
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-48 border-b border-slate-800 mb-2"></div>
              <p className="font-bold text-slate-800 text-[12px]">Prepared By</p>
            </div>
            
            {/* Authorisation Signatures embedded into footer */}
            <div className="flex gap-10">
              {defaultSig && (
                <div className="text-center">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 min-w-[150px] text-[11px]">
                    {defaultSig.personName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                    {defaultSig.designation}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                    {defaultSig.departmentTitle}
                  </div>
                </div>
              )}
              {dutySig && (
                <div className="text-center">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 min-w-[150px] text-[11px]">
                    {dutySig.personName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                    {dutySig.designation}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                    {dutySig.departmentTitle}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-48 border-b border-slate-800 mb-2"></div>
              <p className="font-bold text-slate-800 text-[12px]">Approved By</p>
            </div>
          </div>
        </div>
      </div>

      {/* VALIDATION ERROR FLOATING POPUP */}
      {validationError && (
        <>
          <div className="fixed inset-0 z-[99] cursor-default" onClick={() => setValidationError(null)} />
          
          <div 
            className="fixed z-[100] bg-white border-l-4 border-l-orange-500 border border-y-slate-200 border-r-slate-200 shadow-xl rounded-md p-2.5 w-[210px] animate-in fade-in zoom-in-95 duration-200 print:hidden"
            style={{ left: validationError.x, top: validationError.y }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Action Required</span>
              <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 leading-snug mb-1">
              Assign all staff for <span className="font-bold text-slate-800">{validationError.date}</span> first.
            </p>
            <p className="text-[10px] text-slate-600 leading-snug">
              Missing S.No: <span className="font-bold text-orange-600">{validationError.missingSnos}</span>
            </p>
          </div>
        </>
      )}

      {/* ASSIGNMENT POPUP */}
      {isModalOpen && activeCell && (
        <div 
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 print:hidden" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-md shadow-2xl w-full max-w-[280px] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()} 
          >
            <div className="px-3 py-2 border-b border-slate-200 flex justify-between items-center bg-slate-800 text-white shrink-0">
              <div>
                <h2 className="text-xs font-bold tracking-wide">Assign Staff (S.No)</h2>
                <div className="text-[9px] text-slate-300 font-medium">
                  {activeCell.displayDate} • <span className="text-blue-300">{activeCell.shift}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-3 bg-slate-50 flex-1">
              {activeDeptStaff.length === 0 ? (
                <div className="text-center text-slate-500 text-[10px] font-bold py-4">
                  No active staff mapped.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeDeptStaff.map(staff => {
                    const currentKey = `${activeCell.date}_${activeCell.shift}`;
                    const isSelected = (assignments[currentKey] || []).includes(staff.empId) || (assignments[currentKey] || []).includes(`RD:${staff.empId}`);
                    
                    const assignedElsewhere = Object.entries(assignments).find(([key, ids]) => {
                      return key.startsWith(`${activeCell.date}_`) && key !== currentKey && (ids.includes(staff.empId) || ids.includes(`RD:${staff.empId}`));
                    });

                    const isLocked = !!assignedElsewhere;
                    const lockedShiftName = assignedElsewhere ? assignedElsewhere[0].split('_')[1] : "";
                    
                    return (
                      <button 
                        key={staff.id}
                        disabled={isLocked}
                        onClick={() => toggleStaffAssignment(staff.empId)}
                        title={isLocked ? `${staff.name} is already assigned to ${lockedShiftName}` : staff.name}
                        className={`h-9 w-9 rounded-md text-xs font-bold flex items-center justify-center transition-all border shadow-sm ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' 
                            : isLocked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                      >
                        {staff.sequence || staff.empId}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-slate-200 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RD CONVERSION MODAL */}
      {rdModalInfo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] print:hidden" onClick={() => setRdModalInfo(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[320px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Convert to RD</h2>
              <button onClick={() => setRdModalInfo(null)} className="text-slate-500 hover:bg-slate-200 p-1 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-slate-700 font-medium mb-6">
                {rdModalInfo.isRd ? "Remove Rest Day (RD) tag?" : "Convert this sequence to a Rest Day (RD)?"}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setRdModalInfo(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
                <button onClick={handleToggleRd} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                  {rdModalInfo.isRd ? "Remove RD" : "Mark as RD"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}