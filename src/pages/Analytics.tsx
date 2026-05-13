import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { Analytics, Sale } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Calendar, Download, TrendingUp, Filter, Activity, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AnalyticsPage Mounting...');
    setLoading(true);
    Promise.all([
      api.analytics.get().catch(err => {
        console.error('Analytics Fetch Error:', err);
        throw new Error(`Analytics API failed: ${err.message}`);
      }),
      api.billing.listSales().catch(err => {
        console.error('Sales Fetch Error:', err);
        throw new Error(`Sales API failed: ${err.message}`);
      })
    ])
    .then(([analyticsData, salesData]) => {
      console.log('Analytics Loaded Successfully:', { analyticsData, salesData });
      setData(analyticsData);
      setSales(salesData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Analytics Loading Catch Block:', err);
      setError(err.message || 'Failed to load analytics data.');
      setLoading(false);
    });
  }, []);

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-slate-200">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <div className="text-center">
        <p className="text-rose-600 font-black text-xl">System Failure</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
      >
        Re-synchronize Data
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="text-center">
        <p className="text-slate-800 font-black text-lg">Aggregating Intelligence</p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1 animate-pulse">Scanning Transactional Nodes...</p>
      </div>
    </div>
  );

  // If data exists, render the content
  return (
    <div className="space-y-8 pb-10">
      {/* Rest of the content stays same but we can keep it as is, 
          since we want to see if the page even renders with simple text first */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance Intelligence</h2>
          <p className="text-slate-500 mt-1">Deep dive into sales and inventory demographics.</p>
        </div>
      </div>

      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
        <p className="text-emerald-800 font-bold">Data Loaded! Daily Total: ₹{data?.daily}</p>
        <p className="text-emerald-600 text-xs">If you see this, the component is rendering correctly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales Record</p>
          <p className="text-2xl font-black text-slate-900">{sales?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Size</p>
          <p className="text-2xl font-black text-slate-900">{data?.totalInventory || 0}</p>
        </div>
      </div>
      
      <p className="text-slate-400 text-xs italic">Rendering charts below...</p>
      
      {/* Re-including charts but wrapped in simple safety checks */}
      {data?.chartData && data.chartData.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trajectory</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      )}
    </div>
  );
}
