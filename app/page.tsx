"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, ChevronRight } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // UPDATED: Now accepts virtually all Excel formats and CSVs
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
      "text/csv": [".csv"]
    },
  });

  return (
    <div className="p-4 flex flex-col h-full max-w-5xl mx-auto">
      
      <div className="mb-4 flex justify-between items-center bg-slate-50 p-2 border border-slate-300 rounded shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-blue-950">Data Consolidation</h1>
        </div>
        {files.length > 0 && (
           <button className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-sm flex items-center">
              Proceed to Mapping
              <ChevronRight className="h-3 w-3 ml-1" />
           </button>
        )}
      </div>

      <div className="flex gap-4 items-start">
        {/* Compact Drag & Drop Box */}
        <div
          {...getRootProps()}
          className={`w-1/3 p-4 border border-dashed rounded-sm text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? "border-teal-500 bg-teal-50" 
              : "border-slate-400 bg-slate-50 hover:border-teal-400"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`mx-auto h-6 w-6 mb-2 ${isDragActive ? "text-teal-600" : "text-slate-400"}`} />
          <p className="text-blue-950 font-semibold text-[11px] mb-1">Click or drag & drop</p>
          {/* UPDATED: UI text reflects new accepted file types */}
          <p className="text-[10px] text-slate-500">.XLSX, .XLS, .XLSM, .CSV</p>
        </div>

        {/* Uploaded Files Table */}
        {files.length > 0 && (
          <div className="flex-1 bg-white border border-slate-400 overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-200 text-slate-800 tracking-tight">
                  <th className="border border-slate-300 px-2 py-1 w-8 text-center">#</th>
                  <th className="border border-slate-300 px-2 py-1">Staged File Name</th>
                  <th className="border border-slate-300 px-2 py-1 text-right w-24">Size</th>
                  <th className="border border-slate-300 px-2 py-1 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index} className="hover:bg-blue-50 group">
                    <td className="border border-slate-300 px-2 py-1 text-center bg-slate-100 text-slate-500 font-mono">{index + 1}</td>
                    <td className="border border-slate-300 px-2 py-1 font-medium truncate max-w-[200px]" title={file.name}>{file.name}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right font-mono text-slate-600">{(file.size / 1024).toFixed(0)} KB</td>
                    <td className="border border-slate-300 px-2 py-0 text-center">
                      <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="text-slate-400 hover:text-red-500 pt-1">
                        <X className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}