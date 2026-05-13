import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Sale } from '../types';
import { 
  Receipt, 
  Calendar, 
  TrendingUp, 
  Search, 
  Filter,
  ArrowUpRight,
  Clock,
  User,
  Phone,
  CreditCard,
  Wallet,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DailyBills() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    api.billing.listSales()
      .then(allSales => {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = allSales.filter(s => s.timestamp.startsWith(today));
        setSales(todaySales);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load daily bills:', err);
        setError('Connection interrupted. Unable to sync daily records.');
        setLoading(false);
      });
  }, []);

  const totals = useMemo(() => {
    const total = sales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
    const count = sales.length;
    const upi = sales.filter(s => s.payment_method === 'UPI').reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
    const cash = sales.filter(s => s.payment_method === 'Cash').reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
    return { total, count, upi, cash };
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_phone.includes(searchTerm) ||
      s.id.toString().includes(searchTerm)
    );
  }, [sales, searchTerm]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return <Smartphone className="w-4 h-4" />;
      case 'Card': return <CreditCard className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Today's Ledger</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Daily Records</h2>
          <p className="text-slate-500 font-medium font-mono text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input 
            type="text"
            placeholder="Search by ID, name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Today's Revenue</p>
          </div>
          <p className="text-3xl font-black">{formatCurrency(totals.total)}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Receipt className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bills Generated</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{totals.count}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI Collection</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.upi)}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash Collection</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.cash)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Transaction Log</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Sync</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-4">Ref ID</th>
                <th className="px-8 py-4">Customer Details</th>
                <th className="px-8 py-4">Time</th>
                <th className="px-8 py-4">Method</th>
                <th className="px-8 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {filteredSales.map((sale) => (
                  <motion.tr 
                    key={sale.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-mono font-black text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        #{sale.id.toString().padStart(5, '0')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200">
                          {sale.customer_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{sale.customer_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tight">+91 {sale.customer_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          {new Date(sale.timestamp.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                        sale.payment_method === 'UPI' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        sale.payment_method === 'Card' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {getMethodIcon(sale.payment_method)}
                        <span className="text-[10px] font-black uppercase tracking-widest">{sale.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-black text-lg text-slate-900 tracking-tight">{formatCurrency(sale.total_amount)}</p>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Receipt className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">No synchronized records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
