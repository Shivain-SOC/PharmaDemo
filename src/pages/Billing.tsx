import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  Share2,
  X,
  Receipt
} from 'lucide-react';
import { api } from '../lib/api';
import { Medicine } from '../types';
import { toast } from 'sonner';

interface CartItem extends Medicine {
  quantity: number;
}

export default function Billing() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pharmasync_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('pharmasync_customer');
    return saved ? JSON.parse(saved) : { name: '', phone: '' };
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [isProcessing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  useEffect(() => {
    api.inventory.list().then(setMedicines);
  }, []);

  useEffect(() => {
    localStorage.setItem('pharmasync_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pharmasync_customer', JSON.stringify(customer));
  }, [customer]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return medicines.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) && m.stock > 0
    ).slice(0, 5);
  }, [searchTerm, medicines]);

  const addToCart = (med: Medicine) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
    setSearchTerm('');
    toast.success(`${med.name} added to cart`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    const tax = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity * item.gst_percent / 100), 0);
    const discountAmount = (subtotal + tax) * (discountPercent / 100);
    const total = subtotal + tax - discountAmount;
    return { subtotal, tax, discountAmount, total };
  }, [cart, discountPercent]);

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!customer.name || !customer.phone) return toast.error('Customer details required');
    
    // Name validation: Alphabets and spaces only
    if (!/^[A-Za-z\s]+$/.test(customer.name)) {
      return toast.error('Name should only contain alphabets');
    }

    // Phone validation: Exactly 10 digits
    if (!/^\d{10}$/.test(customer.phone)) {
      return toast.error('Phone number must be exactly 10 digits');
    }

    setProcessing(true);
    try {
      const result = await api.billing.createSale({
        customerName: customer.name,
        customerPhone: customer.phone,
        items: cart,
        totalAmount: totals.total,
        paymentMethod
      });

      setLastInvoice({
        id: result.id,
        items: [...cart],
        customer,
        totals,
        paymentMethod,
        date: new Date().toLocaleString()
      });

      toast.success('Sale completed successfully!');
      
      // Update local medicines stock
      const updatedMeds = medicines.map(m => {
        const cartItem = cart.find(ci => ci.id === m.id);
        if (cartItem) return { ...m, stock: m.stock - cartItem.quantity };
        return m;
      });
      setMedicines(updatedMeds);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const clearSession = () => {
    setCart([]);
    setCustomer({ name: '', phone: '' });
    setDiscountPercent(10);
    localStorage.removeItem('pharmasync_cart');
    localStorage.removeItem('pharmasync_customer');
    setLastInvoice(null);
    toast.info('Billing session reset');
  };

  const simulateWhatsApp = () => {
    const message = `*INVOICE FROM PHARMASYNC*%0A%0ADear ${lastInvoice.customer.name},%0AThank you for your purchase.%0A%0AOrder ID: ${lastInvoice.id}%0ADate: ${lastInvoice.date}%0A%0ATotal Amount: *₹${lastInvoice.totals.total.toFixed(2)}*%0A%0AHave a healthy day!`;
    const url = `https://wa.me/91${lastInvoice.customer.phone}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Quick Checkout Bar (Mobile Only) */}
      {cart.length > 0 && !lastInvoice && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-6 left-6 right-6 z-40"
        >
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-lg">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Amount</p>
              <p className="text-2xl font-black">₹{totals.total.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => {
                const checkoutPanel = document.getElementById('checkout-panel');
                checkoutPanel?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              CHECKOUT
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-full pb-10">
      {/* Left Pane: Item Selection */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-visible">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <Search className="w-5 h-5 text-emerald-600" />
            Quick Add Medicine
          </h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, category or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-5 focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg outline-none font-bold"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                >
                  {searchResults.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => addToCart(m)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                    >
                      <div className="flex items-center gap-4">
                         <img src={m.image_url} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                         <div className="text-left">
                           <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{m.name}</p>
                           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{m.category} • {m.stock} in stock</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 leading-tight">₹{m.selling_price}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Select +</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Billed Items
            </h3>
            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
              {cart.length} Products
            </span>
          </div>
          
          <div className="space-y-4 flex-1">
            <AnimatePresence mode="popLayout">
              {cart.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={item.id}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:border-emerald-500/20 hover:shadow-lg"
                >
                  <img src={item.image_url} className="w-16 h-16 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Batch: {item.batch_number} • tax {item.gst_percent}%</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold text-sm w-6 text-center text-slate-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-black text-slate-900 text-lg">₹{(item.selling_price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-xs">Waiting for selections...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: Checkout */}
      <div className="space-y-8" id="checkout-panel">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xl font-bold text-slate-800">Checkout Panel</h3>
            <button 
              onClick={clearSession}
              className="px-3 py-1 bg-rose-50 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              Reset All
            </button>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Customer Full Name"
                  value={customer.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[A-Za-z\s]+$/.test(val)) {
                      setCustomer({...customer, name: val});
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="Contact Mobile"
                  value={customer.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) {
                      setCustomer({...customer, phone: val});
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[ {id: 'Cash', icon: Banknote}, {id: 'UPI', icon: Smartphone}, {id: 'Card', icon: CreditCard} ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-xs font-bold transition-all border ${
                    paymentMethod === m.id 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                      : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <m.icon className="w-5 h-5 mb-1" />
                  {m.id}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <div className="flex justify-between items-center text-slate-500 text-sm font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-sm font-bold uppercase tracking-widest">
              <span>Tax Valuation</span>
              <span className="text-slate-900">₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Discount (%)</span>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                <input 
                  type="number" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-12 bg-transparent text-right font-black text-emerald-600 outline-none"
                />
                <span className="text-emerald-600 font-bold">%</span>
              </div>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
                <span>Saved Amount</span>
                <span>- ₹{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1">Total Payable</span>
              <span className="text-4xl font-black text-emerald-600">₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            disabled={isProcessing || cart.length === 0}
            onClick={handleSubmit}
            className="w-full mt-10 bg-emerald-600 text-white py-6 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none uppercase tracking-widest text-sm"
          >
            {isProcessing ? 'Validating...' : 'Confirm Checkout'}
          </button>
        </div>
      </div>

      {/* Invoice Modal Simulation */}
      <AnimatePresence>
        {lastInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setLastInvoice(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{opacity:0, scale:0.9, y:20}}
              animate={{opacity:1, scale:1, y:0}}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden relative z-10 shadow-2xl border border-slate-800"
            >
              <div className="bg-slate-900 p-10 text-white text-center relative">
                <button onClick={() => setLastInvoice(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Transaction Complete</h3>
                <p className="text-slate-400 font-mono mt-2">ID: {lastInvoice.id}</p>
              </div>
              
              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">PharmaSync<br/><span className="text-emerald-600">Industries</span></h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Licensed Retailer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 uppercase">{lastInvoice.customer.name}</p>
                    <p className="text-xs font-bold text-slate-400 font-mono tracking-tighter">{lastInvoice.customer.phone}</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">{lastInvoice.date}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {lastInvoice.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Qty: {item.quantity} • EXP: {new Date(item.expiry_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-black text-slate-900">₹{(item.selling_price * item.quantity).toFixed(2).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                   <div className="space-y-2">
                     <div className="bg-slate-50 px-4 py-2 rounded-xl inline-block mr-2">
                       <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Method</p>
                       <p className="font-black text-slate-800">{lastInvoice.paymentMethod}</p>
                     </div>
                     {lastInvoice.totals.discountAmount > 0 && (
                       <div className="bg-emerald-50 px-4 py-2 rounded-xl inline-block">
                         <p className="text-[10px] text-emerald-600 uppercase tracking-widest font-black">Discount Applied</p>
                         <p className="font-black text-emerald-700">-₹{lastInvoice.totals.discountAmount.toFixed(2)}</p>
                       </div>
                     )}
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black mb-1">Final Amount</p>
                     <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{lastInvoice.totals.total.toFixed(2)}</p>
                   </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 flex flex-col gap-3 border-t border-slate-100">
                <div className="flex gap-4">
                  <button className="flex-1 bg-white border border-slate-200 text-slate-800 py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    <Printer className="w-5 h-5" />
                    PRINT
                  </button>
                  <button 
                    onClick={simulateWhatsApp}
                    className="flex-1 bg-[#25D366] text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-emerald-500/10"
                  >
                    <Share2 className="w-5 h-5" />
                    WHATSAPP
                  </button>
                </div>
                <button 
                  onClick={clearSession}
                  className="w-full py-4 rounded-xl text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-emerald-600 transition-colors"
                >
                  Start New Transaction (Clear Cart)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
