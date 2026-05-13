/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden relative z-50`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            Pharma<span className="text-emerald-600">Sync</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
          <SidebarLink to="/inventory" icon={Package} label="Inventory" active={location.pathname === '/inventory'} />
          <SidebarLink to="/billing" icon={ShoppingCart} label="New Bill" active={location.pathname === '/billing'} />
          <SidebarLink to="/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/analytics'} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 mb-4">
            <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Store Status</p>
            <p className="text-white text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Online & Active
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-100 pt-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-800">{user.username}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 capitalize">
              {location.pathname.substring(1) || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Quick search medicines..." 
                className="w-full bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {children}
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
      <Toaster position="top-right" closeButton richColors />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
        } />
        
        <Route path="/*" element={
          user ? (
            <MainLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="billing" element={<Billing />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MainLayout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}
