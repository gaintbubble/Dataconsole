import React from "react";
import { prisma } from "@/app/lib/prisma";
import { LayoutDashboard, Users, Clock, AlertCircle } from "lucide-react";
import DashboardFilters from "./components/DashboardFilters";

export const dynamic = 'force-dynamic';

export default async function RosterDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });

  const params = await searchParams;
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = typeof params.date === 'string' ? params.date : todayStr;
  const deptFilter = typeof params.dept === 'string' ? params.dept : "";

  // 1. Fetch Roster Records for the date
  const rosterQuery = {
    where: {
      date: dateStr,
      ...(deptFilter ? { department: deptFilter } : {})
    }
  };
  const rosterRecords = await prisma.roster.findMany(rosterQuery);

  // 2. Collect unique empIds
  const empIdsSet = new Set<string>();
  rosterRecords.forEach(record => {
    record.empIds.forEach(id => {
      const realId = id.startsWith('RD:') ? id.substring(3) : id;
      empIdsSet.add(realId);
    });
  });

  // 3. Fetch Employee Details
  const employees = await prisma.employee.findMany({
    where: {
      empId: { in: Array.from(empIdsSet) }
    }
  });

  const employeeMap = new Map(employees.map(e => [e.empId, e]));
  
  // Total stats logic
  const totalStaff = await prisma.employee.count({
    where: deptFilter ? { department: deptFilter, status: 'Active' } : { status: 'Active' }
  });
  const onDutyCount = empIdsSet.size;
  const offDutyCount = Math.max(0, totalStaff - onDutyCount);

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100">
      <DashboardFilters departments={departments} defaultDate={todayStr} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: "Total Staff", value: totalStaff.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "On Duty Selected Date", value: onDutyCount.toString(), icon: Clock, color: "text-teal-600", bg: "bg-teal-50" },
          { title: "Off Duty / Leave", value: offDutyCount.toString(), icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 border border-slate-300 rounded shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
              <h2 className="text-2xl font-extrabold text-slate-800">{stat.value}</h2>
            </div>
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-300 flex-1 rounded shadow-sm p-4 overflow-auto">
        {rosterRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
            No duties assigned for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {rosterRecords.map((record) => (
              <div key={record.id} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm truncate pr-2">{record.department}</span>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                    {record.shiftName.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-3 flex-1">
                  {record.empIds.length > 0 ? (
                    <ul className="space-y-1.5">
                      {record.empIds.map(empId => {
                        const isRd = empId.startsWith('RD:');
                        const realId = isRd ? empId.substring(3) : empId;
                        const emp = employeeMap.get(realId);
                        return (
                          <li key={empId} className="text-sm flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${isRd ? 'bg-yellow-500' : 'bg-teal-500'} shrink-0`}></span>
                            <span className={`font-medium ${isRd ? 'text-slate-500' : 'text-slate-800'} truncate`}>{emp ? emp.name : realId}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">({realId}){isRd ? ' [RD]' : ''}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No employees assigned</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}