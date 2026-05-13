import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Plus,
  ShoppingCart,
  IndianRupee
} from 'lucide-react';
import { api } from '../lib/api';
import { Analytics, Medicine } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-opacity-10`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-lg`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
    <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
  </motion.div>
);

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analytics.get(),
      api.inventory.list()
    ]).then(([analyticsData, inventoryData]) => {
      setData(analyticsData);
      setMedicines(inventoryData);
    }).catch(err => {
      console.error(err);
      setError('Failed to load dashboard data');
    });
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-rose-500 font-bold">{error}</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-slate-400">Loading metrics...</div>;

  const expiringSoon = medicines.filter(m => {
    const expiry = new Date(m.expiry_date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Store Overview</h2>
          <p className="text-slate-400 mt-1">Real-time performance and inventory metrics.</p>
        </div>
        <Link to="/billing" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Create New Bill
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Daily Revenue" value={`₹${data.daily.toLocaleString()}`} icon={TrendingUp} trend={12.5} color="bg-emerald-600 shadow-emerald-100" />
        <StatCard title="Low Stock Alerts" value={data.lowStock.length.toString().padStart(2, '0')} icon={AlertTriangle} trend={-4} color="bg-rose-500 shadow-rose-100" />
        <StatCard title="Total Stock Items" value={data.totalInventory.toLocaleString()} icon={Package} color="bg-blue-500 shadow-blue-100" />
        <StatCard title="Expiring Soon" value={expiringSoon.length.toString().padStart(2, '0')} icon={Activity} color="bg-indigo-500 shadow-indigo-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sales Overview</h3>
              <p className="text-sm text-slate-400">Weekly revenue performance trend</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-lg outline-none cursor-pointer">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 'bold', color: '#059669' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Moving Items</h3>
          <div className="space-y-6 flex-1">
            {data.topSelling.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-100 uppercase text-xs">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{item.name}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{item.count} units</p>
                </div>
                <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(item.count / (data.topSelling[0]?.count || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-bold hover:border-emerald-500/50 hover:text-emerald-600 transition-all uppercase tracking-widest">
            View Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Critical Alerts</h3>
            <Link to="/inventory" className="text-xs font-bold text-emerald-600 hover:underline uppercase tracking-widest">Restock All</Link>
          </div>
          <div className="space-y-3">
            {data.lowStock.slice(0, 5).map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <div>
                    <p className="font-bold text-xs text-rose-900">{med.name}</p>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{med.stock} units remaining</p>
                  </div>
                </div>
                <button className="bg-white text-rose-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">
                  Order
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Expiry Intelligence</h3>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">Next 90 Days</span>
          </div>
          <div className="space-y-3">
            {expiringSoon.slice(0, 5).map((med) => {
              const diffDays = Math.ceil((new Date(med.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={med.id} className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl group hover:bg-indigo-50 transition-all">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="font-bold text-xs text-indigo-900">{med.name}</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        Expires in {diffDays} days ({new Date(med.expiry_date).toLocaleDateString()})
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/inventory?search=${med.name}`}
                    className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
            {expiringSoon.length === 0 && (
              <div className="py-10 text-center text-slate-300">
                <p className="text-xs font-black uppercase tracking-widest">No aging stock detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
