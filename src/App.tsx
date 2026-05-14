/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ReactNode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Layout/App Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-black text-rose-600 mb-2">Application Crash</h2>
            <p className="text-slate-600 text-sm mb-6">A critical error occurred in the component tree.</p>
            <div className="bg-slate-50 p-4 rounded-xl mb-6 overflow-auto max-h-40">
              <code className="text-xs text-rose-500 font-mono">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import { 
  LayoutDashboard, 
  Package, 
  ReceiptIndianRupee, 
  BarChart3, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  History,
  User as UserIcon,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { api } from './lib/api';
import { User, Analytics, Medicine } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import AnalyticsPage from './pages/Analytics';
import DailyBills from './pages/DailyBills';
import Login from './pages/Login';

const SidebarLink = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
    <span className="font-semibold">{label}</span>
  </Link>
);

const MainLayout = ({ user, children, onLogout }: any) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();

  // Handle mobile drawer behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 lg:w-0'
        } fixed lg:relative bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-500 ease-in-out z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100">
              P
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Pharma<span className="text-emerald-600">Sync</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
          <SidebarLink to="/inventory" icon={Package} label="Inventory" active={location.pathname === '/inventory'} />
          <SidebarLink to="/billing" icon={ShoppingCart} label="New Bill" active={location.pathname === '/billing'} />
          <SidebarLink to="/daily-bills" icon={History} label="Daily Records" active={location.pathname === '/daily-bills'} />
          <SidebarLink to="/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/analytics'} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-[1.5rem] p-5 mb-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
            <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-widest relative z-10">System Status</p>
            <p className="text-white text-xs font-black flex items-center gap-2 relative z-10">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              LIVE SERVER
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate text-slate-800">{user.username}</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Authorized Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 rounded-2xl transition-all shadow-sm"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block" />
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              {location.pathname.substring(1).replace('-', ' ') || 'Overview'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="relative hidden xl:block w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Secure Database Search..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all outline-none placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <button className="relative p-3 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-right" closeButton richColors />
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/*" element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="daily-bills" element={<DailyBills />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </ErrorBoundary>
              </MainLayout>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
