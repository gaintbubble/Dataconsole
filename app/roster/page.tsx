"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Printer, Save, Users, X, FileText, FileSpreadsheet } from "lucide-react";
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

export default function RosterPage() {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ date: string, shift: string, displayDate: string } | null>(null);
  const [rdModalInfo, setRdModalInfo] = useState<{ empId: string, cellKey: string, isRd: boolean } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [authorisations, setAuthorisations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [publicHolidays, setPublicHolidays] = useState<any[]>([]);
  const [globalShifts, setGlobalShifts] = useState<any[]>([]);
  const [orgSettings, setOrgSettings] = useState<{orgName: string, logoUrl: string, copyTo?: string[], showQrCode?: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
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

  // Generate days for the selected month
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

  const activeDeptStaff = useMemo(() => {
    return staffList
      .filter(s => s.department === selectedDept && s.status === "Active")
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [staffList, selectedDept]);

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

  const getShiftForDay = (empId: string, dateKey: string, isWeekend: boolean) => {
    // Check assignments for this day
    for (const shift of departmentShifts) {
      const key = `${dateKey}_${shift.name}`;
      if (assignments[key]) {
        if (assignments[key].includes(`RD:${empId}`)) {
          return "RD";
        }
        if (assignments[key].includes(empId)) {
          return shift.name;
        }
      }
    }
    // No automatic W/O on weekends; only show data when explicitly added
    return "";
  };

  const getHolidayForDay = (dateKey: string) => {
    return publicHolidays.find(h => h.date.startsWith(dateKey));
  };

  const exportToExcel = async () => {
    setIsExportOpen(false);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employee Roster");

    const totalCols = 3 + daysInMonth.length;
    worksheet.mergeCells(1, 1, 1, totalCols);
    const sheetTitle = `${orgSettings?.orgName || "General Hospital"} - Duty Roster`;
    worksheet.getCell('A1').value = sheetTitle;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells(2, 1, 2, totalCols);
    worksheet.getCell('A2').value = `Employee Wise Roster - ${MONTHS[selectedMonth]} ${selectedYear} (${selectedDept})`;
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    const row1 = ["Sr", "Employee Name", "Emp ID", ...daysInMonth.map(d => d.getDate())];
    const headerRow1 = worksheet.addRow(row1);
    
    const row2 = ["Weekday", "", "", ...daysInMonth.map(d => d.toLocaleDateString('en-US', {weekday:'short'}))];
    const headerRow2 = worksheet.addRow(row2);

    worksheet.mergeCells('A4:C4');

    [headerRow1, headerRow2].forEach((row, rowIndex) => {
      row.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        if (colNumber > 3) {
          const dayIndex = colNumber - 4;
          const day = daysInMonth[dayIndex];
          const isSunday = day.getDay() === 0;
          const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const holiday = getHolidayForDay(dateKey);
          
          if (holiday) {
            const argbColor = holiday.color.startsWith('#') ? holiday.color.replace('#', 'FF').toUpperCase() : 'FF000000';
            cell.font = { bold: true, color: { argb: argbColor } };
          } else if (isSunday) {
            cell.font = { bold: true, color: { argb: 'FFFF0000' } }; // Red
          }
        }
      });
    });

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 12;
    for(let i=0; i<daysInMonth.length; i++) worksheet.getColumn(i+4).width = 8;

    activeDeptStaff.forEach((person, idx) => {
      const rowData: any[] = [ person.sequence || idx + 1, person.name, person.empId ];
      
      daysInMonth.forEach(day => {
        const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const isWeekend = day.getDay() === 0;
        const holiday = getHolidayForDay(dateKey);
        rowData.push(getShiftForDay(person.empId, dateKey, isWeekend || !!holiday));
      });
      
      const excelRow = worksheet.addRow(rowData);
      excelRow.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        if (colNumber > 3) {
          const dayIndex = colNumber - 4;
          const day = daysInMonth[dayIndex];
          const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const isSunday = day.getDay() === 0;
          const holiday = getHolidayForDay(dateKey);
          
          if (holiday) {
            const argbColor = holiday.color.startsWith('#') ? holiday.color.replace('#', 'FF').toUpperCase() : 'FFFFEBEB';
            cell.font = { color: { argb: 'FF000000' }, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
          } else if (isSunday) {
            cell.font = { color: { argb: 'FFFF0000' }, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } };
          }

          const cellVal = String(cell.value || "");
          if (cellVal === "W/O" || cellVal === "WO") {
            cell.font = { color: { argb: 'FFFF0000' }, bold: true };
            if (!isSunday && !holiday) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
          } else if (cellVal === "RD") {
            cell.font = { color: { argb: 'FFCA8A04' }, bold: true }; // Yellow-600
            if (!isSunday && !holiday) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
          }
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Employee_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}.xlsx`);
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
      pdf.save(`Employee_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
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

  const handleToggleRd = () => {
    if (!rdModalInfo) return;
    const { empId, cellKey, isRd } = rdModalInfo;
    const newAssignedIds = [...(assignments[cellKey] || [])];
    
    // Remove both empId and RD:empId from this shift just in case
    const cleanedIds = newAssignedIds.filter(id => id !== empId && id !== `RD:${empId}`);
    
    if (isRd) {
      // it was RD, we want to remove the RD status (revert to WO)
      cleanedIds.push(empId);
    } else {
      // it was not RD, so we want to mark it as RD
      cleanedIds.push(`RD:${empId}`);
    }
    
    setAssignments({ ...assignments, [cellKey]: cleanedIds });
    setRdModalInfo(null);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Employee_Wise_Roster_${MONTHS[selectedMonth]}_${selectedYear}`,
  });

  const defaultSig = useMemo(() => {
    return authorisations.find(a => a.department === selectedDept && isActuallyDefault(a.isDefault));
  }, [authorisations, selectedDept]);

  const nonDefaultSig = useMemo(() => {
    return authorisations.find(a => a.department === selectedDept && !isActuallyDefault(a.isDefault));
  }, [authorisations, selectedDept]);

  return (
    <div className="p-4 bg-slate-100 relative print:h-auto">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
            zoom: 0.45;
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
      <div className={`mb-3 flex flex-wrap items-center justify-between bg-white p-2 border border-slate-300 rounded shadow-sm gap-2 ${isExportingPDF ? 'hidden' : 'print:hidden'}`}>
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-50 rounded-sm border border-slate-300 shadow-sm h-8">
            <button onClick={() => setSelectedMonth(p => p === 0 ? 11 : p - 1)} className="px-1.5 hover:bg-slate-200 text-slate-600 transition-colors h-full flex items-center">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center border-x border-slate-200 h-full">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                className="appearance-none bg-transparent pl-1.5 pr-1 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))} 
                className="appearance-none bg-transparent pl-1 pr-1.5 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => setSelectedMonth(p => p === 11 ? 0 : p + 1)} className="px-1.5 hover:bg-slate-200 text-slate-600 transition-colors h-full flex items-center">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 h-8 bg-slate-50 border border-slate-300 rounded-sm px-1.5 shadow-sm">
            <span className="text-[9px] text-slate-500 font-bold uppercase mx-1">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="appearance-none bg-transparent py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[90px]"
            />
            <span className="text-[9px] text-slate-500 font-bold uppercase mx-1 border-l border-slate-200 pl-1.5">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="appearance-none bg-transparent py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-[90px]"
            />
            {(fromDate || toDate) && (
              <button 
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                title="Clear range"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-50 rounded-sm border border-slate-300 shadow-sm px-2 h-8">
            <Users className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-transparent pr-4 text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none w-[120px] truncate"
            >
              <option value="">- All Departments -</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative">
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1 px-2.5 h-8 bg-white border border-slate-300 text-slate-700 rounded-sm font-bold text-[11px] hover:bg-slate-50 transition-colors shadow-sm"
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
          <button onClick={() => generatePDF('print')} className="flex items-center justify-center gap-1 px-2 h-8 bg-white border border-slate-300 text-slate-700 rounded-sm font-bold text-[10px] hover:bg-slate-50 transition-colors shadow-sm hidden md:flex">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={saveToDatabase} className="flex items-center justify-center gap-1 px-3 h-8 bg-indigo-600 text-white rounded-sm font-bold text-[10px] hover:bg-indigo-700 transition-colors shadow-sm">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <div ref={printRef} className="print-container bg-white p-4 print:p-0 print:pt-[20mm] print:px-[15mm] print:pb-[10mm]">
        
        {/* PRINT-ONLY HEADER */}
        <div className={`${isExportingPDF ? 'block' : 'hidden print:block'} mb-6 print:mb-2`}>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-4">
              {orgSettings?.logoUrl && (
                <img src={orgSettings.logoUrl} alt="Logo" className="h-24 w-auto" />
              )}
              <h1 className="text-3xl font-black text-slate-900 whitespace-nowrap">{orgSettings?.orgName || "General Hospital"}</h1>
            </div>
            <h2 className="text-lg font-bold text-slate-700 mt-2">Duty Roster - Employee Wise</h2>
          </div>
          <div className="flex justify-between items-center mt-4 border-b-2 border-slate-800 pb-2">
            <p className="font-bold text-slate-800">Department: {selectedDept || 'All'}</p>
            <p className="font-bold text-slate-800">Month: {MONTHS[selectedMonth]} {selectedYear}</p>
          </div>
        </div>

        <div className={isExportingPDF ? 'overflow-visible shadow-sm border border-slate-300 bg-white' : 'shadow-sm border border-slate-300 bg-white print:border-none print:shadow-none print:overflow-visible'}>
        
        <div className={`roster-table-container ${isExportingPDF ? 'overflow-visible' : 'overflow-auto'}`} style={!isExportingPDF ? { height: 'calc(100vh - 200px)' } : {}}>
          <table className="w-full text-[11px] border-collapse min-w-max">
            <thead className="bg-slate-800 text-slate-100 shadow-sm print-color-adjust-exact">
              <tr className="h-9">
                <th className="border border-slate-600 print:border-slate-500 px-2 py-2 text-center font-bold w-12 sticky left-0 top-0 z-30 bg-slate-800 print:text-[16px]">Sr</th>
                <th className="border border-slate-600 print:border-slate-500 px-3 py-2 text-left font-bold w-40 sticky left-12 top-0 z-30 bg-slate-800 print:text-[16px]">Employee Name</th>
                <th className="border border-slate-600 print:border-slate-500 px-2 py-2 text-center font-bold w-20 sticky left-[13rem] top-0 z-30 bg-slate-800 print:text-[16px]">Emp ID</th>
                {daysInMonth.map(day => {
                  const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const isSunday = day.getDay() === 0;
                  const holiday = getHolidayForDay(dateKey);
                  return (
                    <th 
                      key={day.toISOString()} 
                      className={`border border-slate-600 print:border-slate-500 p-1 text-center font-bold w-8 print:text-[16px] sticky top-0 z-10 bg-slate-800 ${isSunday && !holiday ? 'text-red-400' : ''}`}
                      style={holiday ? { color: holiday.color } : {}}
                    >
                      {day.getDate()}
                    </th>
                  );
                })}
              </tr>
              <tr className="h-7">
                <th colSpan={3} className="border border-slate-600 print:border-slate-500 px-2 py-1 text-center text-[10px] font-medium text-slate-300 sticky left-0 top-9 z-30 bg-slate-700 print:text-[16px]">
                  Weekday
                </th>
                {daysInMonth.map(day => {
                  const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const isSunday = day.getDay() === 0;
                  const holiday = getHolidayForDay(dateKey);
                  
                  return (
                    <th 
                      key={`day-${day.toISOString()}`} 
                      className={`border border-slate-600 print:border-slate-500 p-1 text-center text-[9px] print:text-[15px] font-bold uppercase bg-slate-700 sticky top-9 z-10 ${isSunday && !holiday ? 'text-red-400' : 'text-slate-300'}`}
                      style={holiday ? { color: holiday.color } : {}}
                      title={holiday ? holiday.name : undefined}
                    >
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 print:divide-black">
              {isLoading ? (
                <tr>
                  <td colSpan={daysInMonth.length + 3} className="text-center p-8 text-slate-500 font-medium">Loading Roster...</td>
                </tr>
              ) : activeDeptStaff.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 3} className="text-center p-8 text-slate-500 font-medium">No active staff mapped to {selectedDept || 'this department'}</td>
                </tr>
              ) : (
                activeDeptStaff.map((person, index) => (
                  <tr key={person.id} className="hover:bg-slate-50 transition-none group">
                    <td className="border border-slate-200 print:border-black p-1.5 print:py-2 text-center font-bold text-slate-700 sticky left-0 z-10 bg-white group-hover:bg-slate-50 print:text-[16px]">
                      {person.sequence || index + 1}
                    </td>
                    <td className="border border-slate-200 print:border-black p-1.5 print:py-2 px-3 text-left font-bold text-slate-800 sticky left-12 z-10 bg-white group-hover:bg-slate-50 truncate max-w-[10rem] print:text-[16px]">
                      {person.name}
                    </td>
                    <td className="border border-slate-200 print:border-black p-1.5 print:py-2 text-center font-mono text-slate-500 sticky left-[13rem] z-10 bg-white group-hover:bg-slate-50 print:text-[16px]">
                      {person.empId}
                    </td>
                    
                    {daysInMonth.map(day => {
                      const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                      const isWeekend = day.getDay() === 0;
                      const holiday = getHolidayForDay(dateKey);
                      const shift = getShiftForDay(person.empId, dateKey, isWeekend || !!holiday);
                      
                      const isOff = shift === "W/O" || shift === "WO" || shift === "RD";
                      
                      let cellBg = 'bg-transparent';
                      let customStyle: React.CSSProperties = {};
                      let textColorClass = 'text-slate-800';
                      
                      if (holiday) {
                        customStyle = { backgroundColor: holiday.color, color: '#000000' };
                        cellBg = 'print-color-adjust-exact';
                        textColorClass = 'font-bold';
                      } else if (isWeekend) {
                        cellBg = 'bg-red-50 print-color-adjust-exact';
                        textColorClass = 'text-red-700 font-bold';
                      }
                      
                      if (isOff) {
                        if (!isWeekend && !holiday) cellBg = 'bg-slate-50 print-color-adjust-exact';
                        const isRD = shift === "RD";
                        if (isRD) {
                          textColorClass = 'text-yellow-600 font-extrabold';
                          if (holiday) customStyle.color = '#ca8a04'; // yellow-600
                        } else {
                          textColorClass = 'text-red-600 font-extrabold';
                          if (holiday) customStyle.color = '#dc2626'; // red-600
                        }
                      }
  
                      return (
                        <td 
                          key={dateKey} 
                          className={`border border-slate-200 print:border-black p-1 print:py-2 text-center text-[10px] print:text-[16px] ${isOff ? 'hover:bg-slate-100 cursor-pointer' : 'hover:bg-blue-100'} transition-colors ${cellBg} ${textColorClass}`}
                          style={customStyle}
                          onClick={() => {
                            if (isOff) {
                              const offShift = departmentShifts.find(s => 
                                s.name.toUpperCase().includes('W/O') || 
                                s.name.toUpperCase().includes('WO') || 
                                s.name.toUpperCase().includes('OFF')
                              );
                              if (offShift) {
                                setRdModalInfo({ empId: person.empId, cellKey: `${dateKey}_${offShift.name}`, isRd: shift === "RD" });
                              }
                            }
                          }}
                        >
                          {shift}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
        
        {/* PRINT-ONLY FOOTER WITH SIGNATURES */}
        <div className={`${isExportingPDF ? 'block mt-24' : 'hidden print:block print:mt-24'} pb-4 pt-20 px-8 break-inside-avoid`}>
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
                    <QRCodeSVG value={`${window.location.origin}/roster?dept=${encodeURIComponent(selectedDept)}&month=${selectedMonth}&year=${selectedYear}`} size={100} />
                  )}
                  <span className="text-[8px] mt-1 text-slate-500 font-bold whitespace-nowrap">Scan for Digital Copy</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-16">
              
              {defaultSig && (
                <div className="flex flex-col items-center text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 inline-block leading-tight min-w-[200px] text-[11px] print:text-[18px]">
                    {defaultSig.personName}
                  </div>
                </div>
                <div className="text-[10px] print:text-[16px] font-bold uppercase tracking-wider text-slate-900">
                  {defaultSig.designation}
                </div>
                <div className="text-[9px] print:text-[14px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                  {defaultSig.departmentTitle}
                </div>
              </div>
            )}

            {nonDefaultSig && (
              <div className="flex flex-col items-center text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="font-bold text-slate-900 border-t border-slate-900 px-4 pt-1 inline-block leading-tight min-w-[200px] text-[11px] print:text-[18px]">
                    {nonDefaultSig.personName}
                  </div>
                </div>
                <div className="text-[10px] print:text-[16px] font-bold uppercase tracking-wider text-slate-900">
                  {nonDefaultSig.designation}
                </div>
                <div className="text-[9px] print:text-[14px] font-bold uppercase tracking-widest text-slate-700 mt-0.5">
                  {nonDefaultSig.departmentTitle}
                </div>
              </div>
            )}
            
            </div>
          </div>
        </div>

      </div>

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
                {rdModalInfo.isRd ? "Remove Rest Day (RD) tag?" : "Convert this shift to a Rest Day (RD)?"}
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