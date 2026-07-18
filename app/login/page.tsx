"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Call NextAuth to verify credentials
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    } else {
      router.push("/database");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      {/* Background decoration to match your sidebar theme */}
      <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="max-w-md w-full p-8 bg-white rounded shadow-xl border border-slate-300 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-slate-950 p-3 rounded-md mb-4 shadow-sm border border-slate-800">
            <Activity className="h-8 w-8 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-blue-950 tracking-wide">MedParser OS</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Secure System Access
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm text-center font-bold shadow-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm text-black placeholder:text-slate-400 shadow-sm"
              placeholder="admin@hospital.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm text-black placeholder:text-slate-400 shadow-sm"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center text-white font-bold py-2.5 rounded-sm text-sm shadow-sm transition-colors mt-2 ${
              isLoading ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            <Lock className="h-4 w-4 mr-2" />
            {isLoading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>
      </div>
    </div>
  );
}