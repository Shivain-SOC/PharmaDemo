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
import { Calendar, Download, TrendingUp, Filter, Activity } from 'lucide-react';

const COLORS = ['#000000', '#2563eb', '#8b5cf6', '#ec4899', '#f97316'];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analytics.get(),
      api.billing.listSales()
    ])
    .then(([analyticsData, salesData]) => {
      setData(analyticsData);
      setSales(salesData);
    })
    .catch(err => {
      console.error(err);
      setError('Failed to load analytics data');
    });
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-rose-500 font-bold">{error}</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-slate-400">Loading metrics...</div>;

  const pieData = useMemo(() => {
    if (!data?.topSelling) return [];
    return data.topSelling.map(item => ({ 
      name: item.name || 'Unknown', 
      value: Number(item.count) || 0 
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!sales || !sales.length) return { totalRevenue: 0, avgValue: 0, estimatedTax: 0, netRevenue: 0 };
    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
    const avgValue = totalRevenue / sales.length;
    const estimatedTax = totalRevenue * 0.12; 
    const netRevenue = totalRevenue - estimatedTax;
    return { totalRevenue, avgValue, estimatedTax, netRevenue };
  }, [sales]);

  const formatDate = (dateStr: string) => {
    try {
      // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS". 
      // Replace space with T to make it a standard ISO string for better reliability.
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance Intelligence</h2>
          <p className="text-slate-500 mt-1">Deep dive into sales and inventory demographics.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
          <Download className="w-5 h-5" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collections</p>
          <p className="text-2xl font-black text-slate-900">₹{Math.round(stats.totalRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated GST</p>
          <p className="text-2xl font-black text-emerald-600">₹{Math.round(stats.estimatedTax).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Sales</p>
          <p className="text-2xl font-black text-slate-900">₹{Math.round(stats.netRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Transaction</p>
          <p className="text-2xl font-black text-indigo-600">₹{Math.round(stats.avgValue).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue Trajectory</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly Sales Performance</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-black">
              <TrendingUp className="w-4 h-4" />
              +14.2%
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Inventory Distribution</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Product Category Mix</p>
             </div>
             <button className="p-2 hover:bg-slate-50 rounded-xl">
               <Filter className="w-5 h-5 text-slate-400" />
             </button>
          </div>
          <div className="h-[350px] w-full grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 hidden md:block">
               {pieData.slice(0, 5).map((entry, index) => (
                 <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][index % 5] }}></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{entry.name}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
             <h3 className="text-xl font-bold text-slate-800">Transaction Registry</h3>
             <p className="text-sm text-slate-400">Complete log of recent sales and payments</p>
           </div>
           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button className="px-4 py-2 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">Activity</button>
              <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Methods</button>
              <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Settlements</button>
           </div>
        </div>

        <div className="overflow-x-auto -mx-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">Ref ID</th>
                <th className="px-8 py-4">Customer Engagement</th>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Methodology</th>
                <th className="px-8 py-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-mono font-black tracking-widest text-slate-500 border border-slate-200">#{sale.id.toString().padStart(5, '0')}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs uppercase shadow-sm border border-emerald-100">
                         {sale.customer_name?.[0] || 'C'}
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">{sale.customer_name || 'Walk-in Customer'}</p>
                         <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">+91 {sale.customer_phone || 'N/A'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formatDate(sale.timestamp)} • {formatTime(sale.timestamp)}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                      sale.payment_method === 'UPI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      sale.payment_method === 'Card' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="font-black text-lg text-slate-900 tracking-tight">₹{Number(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="p-20 text-center text-slate-300">
               <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
               <p className="text-xs font-black uppercase tracking-[0.2em]">No transactional data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Inventory Health Index</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Shelf Life Integrity</p>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-white">94%</span>
                 <span className="text-emerald-400 font-bold text-xs pb-1">Excellent</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{width: '94%'}} />
              </div>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Stock Turnover Ratio</p>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-white">4.2x</span>
                 <span className="text-slate-500 font-bold text-xs pb-1">Industry Avg: 3.8x</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{width: '78%'}} />
              </div>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Service Availability</p>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-white">99.1%</span>
                 <span className="text-emerald-400 font-bold text-xs pb-1">+0.5% MTM</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{width: '99%'}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
