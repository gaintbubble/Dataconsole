"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  from: Date | null;
  to: Date | null;
  label: string;
}

interface DateRangeFilterProps {
  onFilterChange: (range: DateRange) => void;
  buttonClassName?: string;
  align?: "start" | "center" | "end";
  initialRange?: DateRange;
}

// --- HELPER: CUSTOM CALENDAR (DATE ONLY) ---
const MiniCalendar = ({ value, onChange, label }: { value: Date | null, onChange: (d: Date) => void, label: string }) => {
  const [viewDate, setViewDate] = useState(value || new Date());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1));
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

  const isSelected = (d: Date) => {
    return value && d.getDate() === value.getDate() && d.getMonth() === value.getMonth() && d.getFullYear() === value.getFullYear();
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="w-[260px] p-2 bg-white rounded-lg border border-slate-100 shadow-sm mx-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">{label}</div>
        
        <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={14}/></button>
            
            <div className="flex items-center gap-1">
                <select 
                    value={viewDate.getMonth()} 
                    onChange={handleMonthSelect}
                    className="text-xs font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-teal-600 appearance-none text-center"
                    style={{ textAlignLast: 'center' }} 
                >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>

                <select 
                    value={viewDate.getFullYear()} 
                    onChange={handleYearSelect}
                    className="text-xs font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-teal-600 appearance-none"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={14}/></button>
        </div>

        <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[10px] text-center text-slate-400 font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, idx) => (
                <div key={idx} className="h-7 flex items-center justify-center">
                    {d ? (
                        <button
                            onClick={() => onChange(d)}
                            className={`w-6 h-6 rounded-full text-[11px] font-medium transition-all ${
                                isSelected(d) ? 'bg-teal-600 text-white shadow-sm' : isToday(d) ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {d.getDate()}
                        </button>
                    ) : <div />}
                </div>
            ))}
        </div>
    </div>
  );
};

// --- MAIN FILTER COMPONENT ---
export default function DateRangeFilter({ onFilterChange, buttonClassName, align = "end", initialRange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('All Time');
  const [displayLabel, setDisplayLabel] = useState('All Time'); 
  
  const [tempFrom, setTempFrom] = useState<Date | null>(new Date());
  const [tempTo, setTempTo] = useState<Date | null>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRange && initialRange.label) {
        setDisplayLabel(initialRange.label);
        setTempFrom(initialRange.from);
        setTempTo(initialRange.to);
        
        const presets = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Month to Date', 'Last Month', 'Year to Date', 'Last Year', 'Specific Date', 'Date Range'];
        if (presets.includes(initialRange.label)) {
            setActivePreset(initialRange.label);
        } else {
            setActivePreset(initialRange.from?.getTime() === initialRange.to?.getTime() ? 'Specific Date' : 'Date Range');
        }
    }
  }, [initialRange?.from, initialRange?.to, initialRange?.label]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Month to Date', 'Last Month', 'Year to Date', 'Last Year', 'Specific Date', 'Date Range'];

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let from: Date | null = null;
    let to: Date | null = null;

    if (preset === 'Specific Date' || preset === 'Date Range') {
        setActivePreset(preset);
        return;
    }

    switch (preset) {
      case 'All Time': from = null; to = null; break;
      case 'Today': from = today; to = today; break;
      case 'Yesterday':
        const yest = new Date(today); yest.setDate(today.getDate() - 1);
        from = yest; to = yest; break;
      case 'Last 7 Days':
        const last7 = new Date(today); last7.setDate(today.getDate() - 6);
        from = last7; to = today; break;
      case 'Month to Date':
        from = new Date(today.getFullYear(), today.getMonth(), 1); to = today; break;
      case 'Last Month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0); break;
      case 'Year to Date':
        from = new Date(today.getFullYear(), 0, 1); to = today; break;
      case 'Last Year':
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31); break;
    }

    setActivePreset(preset);
    setDisplayLabel(preset); 
    onFilterChange({ from, to, label: preset });
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (!tempFrom) return;
    let from = tempFrom;
    let to = activePreset === 'Specific Date' ? tempFrom : (tempTo || tempFrom);
    const format = (d: Date | null) => d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    let label = activePreset === 'Specific Date' ? format(from) : `${format(from)} - ${format(to)}`;

    setActivePreset(activePreset); 
    setDisplayLabel(label); 
    onFilterChange({ from, to, label });
    setIsOpen(false);
  };

  const finalButtonClass = buttonClassName || "flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all h-8 group min-w-[140px]";

  const alignmentClass = align === 'start' 
    ? 'left-0 md:right-auto' 
    : align === 'center' 
    ? 'left-1/2 -translate-x-1/2'
    : 'right-0 md:left-auto';

  const originClass = align === 'start' 
    ? 'origin-top-left' 
    : align === 'center' 
    ? 'origin-top' 
    : 'origin-top-right';

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      
      <button onClick={() => setIsOpen(!isOpen)} className={finalButtonClass}>
        <div className="flex items-center gap-1.5 w-full">
            <CalendarIcon size={12} className="text-teal-600 shrink-0"/>
            <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis text-left flex-1 mt-[1px]">
                {displayLabel}
            </span>
        </div>
        <ChevronDown size={12} className="text-slate-400 shrink-0"/>
      </button>

      {isOpen && (
        <div className={`absolute ${alignmentClass} ${originClass} scale-[0.85] top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200 ring-1 ring-black/5 max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible`}>
          
          <div className="w-full md:w-40 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 py-2 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
            {presets.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`w-auto md:w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between transition-colors shrink-0 whitespace-nowrap ${
                    activePreset === preset 
                    ? 'bg-white text-teal-600 border-b-4 md:border-b-0 md:border-l-4 border-teal-600 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 border-b-4 md:border-b-0 md:border-l-4 border-transparent'
                }`}
              >
                {preset}
                <span className="hidden md:inline">{activePreset === preset && <Check size={12}/>}</span>
              </button>
            ))}
          </div>
          
          <div className="p-4 bg-white min-h-[300px] flex flex-col justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                {activePreset === 'Specific Date' && <MiniCalendar label="Select Date" value={tempFrom} onChange={setTempFrom} />}

                {activePreset === 'Date Range' && (
                    <>
                        <MiniCalendar label="From Date" value={tempFrom} onChange={setTempFrom} />
                        <div className="w-full h-[1px] md:w-[1px] md:h-auto bg-slate-100 self-stretch"></div>
                        <MiniCalendar label="To Date" value={tempTo} onChange={setTempTo} />
                    </>
                )}

                {!['Specific Date', 'Date Range'].includes(activePreset) && (
                    <div className="w-full md:w-[260px] flex flex-col items-center justify-center text-slate-300 gap-2 h-32 md:h-[250px]">
                        <CalendarIcon size={32} strokeWidth={1.5} />
                        <p className="text-xs font-medium">Select "Custom" options to view calendar</p>
                    </div>
                )}
            </div>

            {['Specific Date', 'Date Range'].includes(activePreset) && (
                <div className="flex justify-end pt-3 border-t border-slate-50 mt-4 md:mt-2 gap-2">
                    <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={applyCustomRange} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded shadow-sm hover:bg-teal-700 transition-colors">Apply Filter</button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}