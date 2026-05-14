import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Download,
  Barcode
} from 'lucide-react';
import { api } from '../lib/api';
import { Medicine } from '../types';
import { toast } from 'sonner';

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  useEffect(() => {
    fetchMeds();
  }, []);

  const fetchMeds = () => {
    setLoading(true);
    setError(null);
    api.inventory.list()
      .then(data => {
        setMedicines(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Connection to inventory records failed.');
        setLoading(false);
      });
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-slate-200">
      <AlertTriangle className="w-12 h-12 text-rose-500" />
      <div className="text-center">
        <p className="text-rose-600 font-bold text-lg">Inventory Sync Failure</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={fetchMeds}
        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
      >
        Retry Fetch
      </button>
    </div>
  );

  if (loading && medicines.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Vault...</p>
    </div>
  );

  const filteredMeds = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = filter === 'All' || m.category === filter;
    if (filter === 'Low Stock') matchesFilter = m.stock <= 10;
    if (filter === 'Expiring Soon') {
      const diffDays = Math.ceil((new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      matchesFilter = diffDays > 0 && diffDays <= 90;
    }
    
    return matchesSearch && matchesFilter;
  });

  const uniqueCategories = Array.from(new Set(medicines.map(m => m.category))).filter((c): c is string => typeof c === 'string');
  const categories: string[] = ['All', 'Low Stock', 'Expiring Soon', ...uniqueCategories];

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.inventory.delete(id);
        toast.success('Medicine removed');
        fetchMeds();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    data.stock = parseInt(data.stock);
    data.purchase_price = parseFloat(data.purchase_price);
    data.selling_price = parseFloat(data.selling_price);
    data.mrp = parseFloat(data.mrp);
    data.gst_percent = parseFloat(data.gst_percent);

    try {
      if (editingMed) {
        await api.inventory.update(editingMed.id, data);
        toast.success('Inventory updated');
      } else {
        await api.inventory.create(data);
        toast.success('Medicine added successfully');
      }
      setModalOpen(false);
      setEditingMed(null);
      fetchMeds();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Inventory Management</h2>
          <p className="text-slate-500">Track stock levels and medicine details.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button 
            onClick={() => { setEditingMed(null); setModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Medicine
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, category or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  filter === cat 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-8 px-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50 rounded-lg">
                <th className="px-6 py-4 first:rounded-tl-lg last:rounded-tr-lg">Medicine & Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4">Costing</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMeds.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative group/img">
                         <img src={m.image_url} alt={m.name} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover/img:scale-110 transition-transform" referrerPolicy="no-referrer" />
                         {m.stock <= 10 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{m.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Batch: {m.batch_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className={`text-sm font-bold ${m.stock <= 10 ? 'text-rose-600' : 'text-slate-700'}`}>{m.stock}</span>
                       <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                         <div 
                           className={`h-full ${m.stock <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min(100, (m.stock / 50) * 100)}%` }} 
                         />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-bold text-slate-900">₹{m.selling_price.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 line-through">MRP: ₹{m.mrp}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${new Date(m.expiry_date) < new Date() ? 'text-rose-600 underline decoration-2' : 'text-slate-500'}`}>
                      {new Date(m.expiry_date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingMed(m); setModalOpen(true); }}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMeds.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100 border-dashed">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Inventory Found</h3>
              <p className="text-sm text-slate-400">Try adjusting your keyword or category filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Integration */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-200"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{editingMed ? 'Modify Record' : 'Add Medication'}</h3>
                  <p className="text-sm text-slate-400">Fill in the product and inventory specifics.</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-2">
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Medicine Brand Name</label>
                   <input required name="name" defaultValue={editingMed?.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold" />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Batch/Lot Number</label>
                   <input required name="batch_number" defaultValue={editingMed?.batch_number} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Component Category</label>
                   <input required name="category" defaultValue={editingMed?.category} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Expiry Date Selection</label>
                   <input required type="date" name="expiry_date" defaultValue={editingMed?.expiry_date?.split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Supplier Entity</label>
                   <input required name="supplier" defaultValue={editingMed?.supplier} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selling Price</label>
                    <input required type="number" step="0.01" name="selling_price" defaultValue={editingMed?.selling_price} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Retail MRP</label>
                    <input required type="number" step="0.01" name="mrp" defaultValue={editingMed?.mrp} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Initial Stock</label>
                    <input required type="number" name="stock" defaultValue={editingMed?.stock} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tax GST %</label>
                    <input required type="number" name="gst_percent" defaultValue={editingMed?.gst_percent || 12} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                  </div>
                </div>
                
                <div className="col-span-2 mt-6">
                  <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:scale-[1.01] active:scale-95">
                    {editingMed ? 'Commit Changes' : 'Enroll Medication'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className, ...props }: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
