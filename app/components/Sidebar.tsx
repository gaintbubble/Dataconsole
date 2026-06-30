"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname(); // This detects exactly which page you are on

  // A clean array of your modules to easily map through them
  const navLinks = [
    { name: "Merge Dashboard", path: "/" },
    { name: "Result Bank", path: "/result-bank" },
    { name: "Admissions", path: "/admissions" },
    { name: "Database Ingestion", path: "/database" },
    { name: "Dictionary Rules", path: "/short-names" },
    { name: "Print Box", path: "/print-box" },
  ];

  return (
    // WIDTH REDUCED: Changed from w-48 to w-36 (144px)
    <aside className="w-36 bg-blue-950 flex flex-col py-4 border-r border-blue-900 z-20 shrink-0">
      
      {/* Logo Area */}
      <div className="px-3 mb-6">
        <div className="w-full bg-teal-600 rounded py-1.5 flex items-center justify-center shadow-sm text-white font-bold text-[11px] tracking-wide">
          DataConsole
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col space-y-1 w-full px-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center px-3 py-2 rounded transition-all border-l-2 ${
                isActive
                  // ACTIVE STATE: Deep highlight with teal text and a left teal border
                  ? "bg-blue-900 text-teal-300 border-teal-400 shadow-sm"
                  // INACTIVE/HOVER STATE: Muted text, lights up white on hover
                  : "text-blue-300/70 border-transparent hover:bg-blue-900/50 hover:text-white"
              }`}
            >
              {/* FONT REDUCED: Using text-[10px] */}
              <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
        
        <div className="flex-1"></div>

        {/* Settings */}
        <Link href="#" className="flex items-center px-3 py-2 text-blue-300/70 border-l-2 border-transparent hover:bg-blue-900/50 hover:text-white rounded transition-all">
          <span className="text-[10px] font-medium tracking-wide">Settings</span>
        </Link>
      </nav>

      {/* User Profile Text */}
      <div className="pt-3 border-t border-blue-900 w-full px-3 mt-2">
        <div className="w-full bg-blue-900/40 rounded py-1 flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors border border-blue-800/30">
          <span className="text-[9px] font-medium text-blue-200">User: Admin</span>
        </div>
      </div>
    </aside>
  );
}