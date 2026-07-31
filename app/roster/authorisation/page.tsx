"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, XCircle, Search, Edit2 } from "lucide-react";

// Interfaces for your data structure
interface Department {
  id: string;
  name: string;
}

interface Authorisation {
  id: string;
  department: string;
  personName: string;
  designation: string;
  departmentTitle: string;
  isDefault: boolean;
}

export default function AuthorisationPage() {
  const [authorisations, setAuthorisations] = useState<Authorisation[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    department: "",
    personName: "",
    designation: "",
    departmentTitle: "",
    isDefault: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const authRes = await fetch("/api/authorisations");
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthorisations(authData);
        }

        const deptRes = await fetch("/api/departments");
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartmentsList(deptData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/authorisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Refetch to get updated defaults across department
        const authRes = await fetch("/api/authorisations");
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthorisations(authData);
        }
        setIsModalOpen(false);
        // Reset form
        setFormData({ 
          id: "",
          department: "", 
          personName: "", 
          designation: "", 
          departmentTitle: "",
          isDefault: false 
        });
      }
    } catch (error) {
      console.error("Error saving authorisation:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this authorisation?")) return;
    try {
      const response = await fetch(`/api/authorisations?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAuthorisations(authorisations.filter((auth) => auth.id !== id));
      }
    } catch (error) {
      console.error("Error deleting authorisation:", error);
    }
  };

  const handleEdit = (auth: Authorisation) => {
    setFormData({
      id: auth.id,
      department: auth.department,
      personName: auth.personName,
      designation: auth.designation,
      departmentTitle: auth.departmentTitle,
      isDefault: auth.isDefault,
    });
    setIsModalOpen(true);
  };

  // Filter Logic: Filter by search text (name/designation) AND department dropdown
  const filteredAuthorisations = authorisations.filter((auth) => {
    const matchesSearch = 
      auth.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auth.designation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === "" || auth.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="p-4">
      {/* Top Action Bar with Search, Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1.5 w-full sm:w-48 border border-slate-300 rounded text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Department Filter Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-slate-300 rounded py-1.5 px-2 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[140px]"
          >
            <option value="">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            setFormData({ id: "", department: "", personName: "", designation: "", departmentTitle: "", isDefault: false });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Authorisation
        </button>
      </div>

      {/* Compact Data Table */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2.5 font-semibold">Department</th>
                <th className="px-4 py-2.5 font-semibold">Person Name</th>
                <th className="px-4 py-2.5 font-semibold">Designation</th>
                <th className="px-4 py-2.5 font-semibold">Dept Title (Signature)</th>
                <th className="px-4 py-2.5 font-semibold text-center">Default Signatory</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredAuthorisations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAuthorisations.map((auth) => (
                  <tr key={auth.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                        {auth.department}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">{auth.personName}</td>
                    <td className="px-4 py-2 text-slate-600">{auth.designation}</td>
                    <td className="px-4 py-2 text-slate-600">{auth.departmentTitle}</td>
                    <td className="px-4 py-2 text-center">
                      {auth.isDefault ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleEdit(auth)}
                        className="text-slate-400 hover:text-blue-600 transition-colors mr-3"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(auth.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">
                {formData.id ? "Edit Authorisation" : "New Authorisation"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Department Dropdown */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Department</option>
                  {departmentsList.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Person Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Department Title (For Signature) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Department Title (For Signature)
                </label>
                <input
                  type="text"
                  required
                  value={formData.departmentTitle}
                  onChange={(e) => setFormData({ ...formData, departmentTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Default Signatory Checkbox */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 block text-[11px] font-medium text-slate-700">
                  Set as Default Signatory on Roster
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ id: "", department: "", personName: "", designation: "", departmentTitle: "", isDefault: false });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}