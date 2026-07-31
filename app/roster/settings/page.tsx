"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Upload, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    orgName: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    logoUrl: "",
    copyTo: ["", "", "", "", "", ""],
    showQrCode: true
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setFormData({
            orgName: data.orgName || "",
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            description: data.description || "",
            logoUrl: data.logoUrl || "",
            copyTo: Array.isArray(data.copyTo) && data.copyTo.length > 0 
              ? [...data.copyTo, "", "", "", "", "", ""].slice(0, 6) 
              : ["", "", "", "", "", ""],
            showQrCode: data.showQrCode !== undefined ? data.showQrCode : true
          });
          if (data.logoUrl) {
            setLogoPreview(data.logoUrl);
          }
        }
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCopyToChange = (index: number, value: string) => {
    setFormData(prev => {
      const newCopyTo = [...prev.copyTo];
      newCopyTo[index] = value;
      return { ...prev, copyTo: newCopyTo };
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col h-full overflow-y-auto">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Organisation Settings
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your facility details, branding, and contact information.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : showSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Saved Successfully
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Branding / Logo */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              Organisation Logo
            </h2>
            
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              {logoPreview ? (
                <div className="flex flex-col items-center">
                  <img src={logoPreview} alt="Logo Preview" className="h-24 w-auto object-contain mb-4 rounded" />
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">Change Logo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Click to upload logo</p>
                  <p className="text-xs text-slate-500">SVG, PNG, or JPG (max. 800x400px)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
              General Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Organisation Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter organisation name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Brief description of the facility"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
              Contact Details
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Primary Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Full street address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              Copy To (Roster Footer)
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index}>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Copy To {index + 1}</label>
                  <input 
                    type="text" 
                    value={formData.copyTo[index]}
                    onChange={(e) => handleCopyToChange(index, e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. Director of Nursing"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              QR Code Settings
            </h2>
            
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="showQrCode"
                  checked={formData.showQrCode}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-700">Show QR Code on Roster Print Footer</span>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
