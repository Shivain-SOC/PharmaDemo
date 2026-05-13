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
import { Calendar, Download, TrendingUp, Filter, Activity, AlertCircle, ShoppingBag, Receipt, Users, Layers } from 'lucide-react';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.analytics.get().catch(err => {
        console.error('Analytics API Error:', err);
        throw new Error(`Analytics module unreachable: ${err.message}`);
      }),
      api.billing.listSales().catch(err => {
        console.error('Sales API Error:', err);
        throw new Error(`Transaction log restricted: ${err.message}`);
      })
    ])
    .then(([analyticsData, salesData]) => {
      setData(analyticsData);
      setSales(salesData);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message || 'System synchronization failed.');
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    if (!sales || sales.length === 0) {
      return { totalRevenue: 0, avgValue: 0, estimatedTax: 0, netRevenue: 0 };
    }
    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
    const avgValue = totalRevenue / sales.length;
    const estimatedTax = totalRevenue * 0.12; 
    const netRevenue = totalRevenue - estimatedTax;
    return { 
      totalRevenue: Number(totalRevenue.toFixed(2)), 
      avgValue: Number(avgValue.toFixed(2)), 
      estimatedTax: Number(estimatedTax.toFixed(2)), 
      netRevenue: Number(netRevenue.toFixed(2)) 
    };
  }, [sales]);

  const pieData = useMemo(() => {
    if (!data?.topSelling) return [];
    return data.topSelling.map(item => ({
      name: item.name,
      value: Number(item.count)
    }));
  }, [data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) ? 'Invalid' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-slate-200">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <div className="text-center">
        <p className="text-rose-600 font-black text-xl">System Failure</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance Intelligence</h2>
          <p className="text-slate-500 mt-1">Deep dive into sales and inventory demographics.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
          <Download className="w-5 h-5" />
          Export Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (GST)</p>
          </div>
          <p className="text-2xl font-black text-indigo-600">{formatCurrency(stats.estimatedTax)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Transaction</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.avgValue)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Items</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{data?.totalInventory || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue Trajectory</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Growth progression logs</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-black">
              <TrendingUp className="w-4 h-4" />
              Pulse: Active
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} 
                  tickFormatter={formatDate}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
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
               <h3 className="text-lg font-bold text-slate-800">Product Distribution</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Top velocity items</p>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
               {pieData.slice(0, 5).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{entry.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 ml-auto">{entry.value} units</p>
                  </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <div>
             <h3 className="text-xl font-bold text-slate-800">Transaction Registry</h3>
             <p className="text-sm text-slate-400">Ledger of recent pharmaceutical exchanges</p>
           </div>
        </div>

        <div className="overflow-x-auto -mx-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">ID</th>
                <th className="px-8 py-4">Engagement</th>
                <th className="px-8 py-4">Log Time</th>
                <th className="px-8 py-4">Protocol</th>
                <th className="px-8 py-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-mono font-black tracking-widest text-slate-500">
                      #{sale.id.toString().padStart(5, '0')}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs">
                         {sale.customer_name[0]}
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-800">{sale.customer_name}</p>
                         <p className="text-[10px] font-bold text-slate-400 font-mono">+91 {sale.customer_phone}</p>
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
                    <p className="font-black text-lg text-slate-900">₹{sale.total_amount.toLocaleString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                 <span className="text-slate-500 font-bold text-xs pb-1">Benchmark: 3.8x</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{width: '78%'}} />
              </div>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Service Availability</p>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-white">99.1%</span>
                 <span className="text-emerald-400 font-bold text-xs pb-1">Active</span>
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
