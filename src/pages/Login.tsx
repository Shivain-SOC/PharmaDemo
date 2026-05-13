import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Pill, User, Lock, Mail } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (u: any) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.login({ username, password });
      onLogin(data.user);
      toast.success('Access granted. Welcome back!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans antialiased text-slate-900">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden min-h-[700px]">
        {/* Visual Side */}
        <div className="relative hidden lg:block bg-slate-900 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1587854685352-25a8220e7e15?auto=format&fit=crop&q=80&w=2000" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
            alt="Pharmacy Lab"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-16 left-16 right-16 z-20">
            <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
              <Pill className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              Precision<br/>
              <span className="text-emerald-400">Inventory</span><br/>
              Intelligence
            </h1>
            <p className="text-slate-400 mt-6 text-lg max-w-sm font-medium leading-relaxed">
              The next generation pharmacy OS. Manage stock, billing and analytics in one unified sleek interface.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-3 mb-12">
              <span className="font-black text-2xl tracking-tighter text-slate-800">Pharma<span className="text-emerald-600">Sync</span></span>
              <div className="h-1 w-1 rounded-full bg-emerald-500 mt-2" />
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
              Access System
            </h2>
            <p className="text-slate-400 font-medium mb-10">
              Enter your administrative credentials to initialize the secure session.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Identifier</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="Username or admin handle"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Passphrase</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-black shadow-xl shadow-emerald-500/10 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 uppercase tracking-widest text-sm"
              >
                {loading ? 'Authenticating...' : 'Authenticate Session'}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-between">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Demo Controls</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="mt-8 text-center text-slate-400">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Pre-Configured Credentials</p>
               <p className="font-mono mt-2 text-slate-900 font-bold bg-slate-50 py-2 rounded-xl border border-slate-100 inline-block px-4">admin / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
