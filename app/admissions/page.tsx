"use client";

import React, { useState } from "react";
import { Users, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdmissionsPage() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleIngest = async () => {
    if (!inputText.trim()) {
      setStatus({ type: 'error', message: 'Please paste raw clinical text to ingest.' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      // Calls your existing extraction API logic
      const res = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: inputText })
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Text successfully parsed and pushed to Database.' });
        setInputText("");
      } else {
        throw new Error("Parsing engine failed to validate text.");
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Processing failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100 min-h-screen">
      <div className="mb-4 flex items-center space-x-3 bg-white p-3 border border-slate-300 rounded shadow-sm">
        <div className="bg-indigo-100 p-1.5 rounded">
          <Users className="h-5 w-5 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-blue-950 tracking-tight">Admissions & Data Ingestion</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Paste raw laboratory blocks to convert into structured Database entries.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TEXT INGESTION BLOCK */}
        <div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col overflow-hidden">
          <div className="bg-slate-50 p-2 font-bold text-blue-950 border-b border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Raw Text Importer</span>
            </div>
            <button 
              onClick={handleIngest} 
              disabled={isProcessing}
              className={`px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UploadCloud className="h-3 w-3" />
              {isProcessing ? 'Parsing...' : 'Process Text'}
            </button>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw patient vitals and lab results here..."
              className="flex-1 w-full border border-slate-300 rounded p-3 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-indigo-500 resize-none bg-slate-50"
            />
            
            {status.type === 'success' && (
              <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {status.message}
              </div>
            )}
            
            {status.type === 'error' && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {status.message}
              </div>
            )}
          </div>
        </div>

        {/* STATUS / GUIDANCE WIDGET */}
        <div className="bg-white border border-slate-300 rounded shadow-sm p-4 flex flex-col justify-center items-center text-center text-slate-500">
          <UploadCloud className="h-12 w-12 text-slate-200 mb-3" />
          <h3 className="text-blue-950 font-bold text-sm mb-1">Waiting for data...</h3>
          <p className="text-[11px] max-w-xs">
            Text submitted through this portal will be processed by the regex engine. Valid records will appear in the <strong>Database</strong> tab, and lab values will route to the <strong>Result Bank</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}