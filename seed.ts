import { getDb } from './db.ts';
import bcrypt from 'bcryptjs';

const MEDICINES = [
  { name: 'Dolo 650', batch: 'BT1023', expiry: '2027-12-31', supplier: 'Cipla Ltd', gst: 12, purchase: 20, selling: 30, mrp: 35, stock: 150, category: 'Antipyretics' },
  { name: 'Azithromycin 500mg', batch: 'AZ8842', expiry: '2026-06-15', supplier: 'Sun Pharma', gst: 12, purchase: 45, selling: 70, mrp: 75, stock: 80, category: 'Antibiotics' },
  { name: 'Crocin Advance', batch: 'CR9910', expiry: '2027-05-20', supplier: 'GSK', gst: 12, purchase: 15, selling: 25, mrp: 30, stock: 200, category: 'Analgesics' },
  { name: 'Augmentin 625 Duo', batch: 'AU4412', expiry: '2026-08-10', supplier: 'GlaxoSmithKline', gst: 12, purchase: 120, selling: 180, mrp: 200, stock: 40, category: 'Antibiotics' },
  { name: 'Cetirizine 10mg', batch: 'CT1102', expiry: '2028-01-01', supplier: 'Dr. Reddy', gst: 12, purchase: 10, selling: 18, mrp: 22, stock: 300, category: 'Antihistamines' },
  { name: 'Pantocid 40mg', batch: 'PT5510', expiry: '2027-03-12', supplier: 'Sun Pharma', gst: 12, purchase: 60, selling: 95, mrp: 110, stock: 120, category: 'Gastrointestinal' },
  { name: 'Limcee Vitamin C', batch: 'LM8821', expiry: '2026-11-30', supplier: 'Abbott', gst: 12, purchase: 12, selling: 20, mrp: 25, stock: 500, category: 'Vitamins' },
  { name: 'Combiflam', batch: 'CM3301', expiry: '2027-09-15', supplier: 'Sanofi', gst: 12, purchase: 25, selling: 40, mrp: 45, stock: 150, category: 'Pain Relief' },
  { name: 'Metformin 500mg', batch: 'MT6612', expiry: '2026-12-20', supplier: 'Lupin', gst: 12, purchase: 30, selling: 50, mrp: 55, stock: 90, category: 'Diabetes' },
  { name: 'Amlong 5mg', batch: 'AM2201', expiry: '2028-02-28', supplier: 'Micro Labs', gst: 12, purchase: 15, selling: 28, mrp: 32, stock: 200, category: 'Hypertension' },
  { name: 'Telma 40', batch: 'TL9910', expiry: '2027-10-15', supplier: 'Glenmark', gst: 12, purchase: 80, selling: 125, mrp: 140, stock: 100, category: 'Hypertension' },
  { name: 'Calpol 500', batch: 'CP4412', expiry: '2026-07-20', supplier: 'GSK', gst: 12, purchase: 18, selling: 28, mrp: 32, stock: 250, category: 'Antipyretics' },
  { name: 'Zantac 150', batch: 'ZN5510', expiry: '2027-04-12', supplier: 'Zydus Cadila', gst: 12, purchase: 15, selling: 25, mrp: 30, stock: 180, category: 'Gastrointestinal' },
  { name: 'Digene Mint Gel', batch: 'DG2201', expiry: '2026-09-30', supplier: 'Abbott', gst: 12, purchase: 110, selling: 150, mrp: 165, stock: 30, category: 'Antacids' },
  { name: 'Shelcal 500', batch: 'SH9912', expiry: '2027-12-15', supplier: 'Torrent', gst: 12, purchase: 65, selling: 95, mrp: 105, stock: 140, category: 'Supplements' },
  { name: 'Becosules Capsules', batch: 'BC1102', expiry: '2028-05-10', supplier: 'Pfizer', gst: 12, purchase: 35, selling: 55, mrp: 60, stock: 300, category: 'Vitamins' },
  { name: 'Voveran Emulgel', batch: 'VV4412', expiry: '2026-11-20', supplier: 'Novartis', gst: 12, purchase: 85, selling: 130, mrp: 145, stock: 60, category: 'Pain Relief' },
  { name: 'Otrivin Nasal Spray', batch: 'OT5511', expiry: '2027-06-15', supplier: 'GSK', gst: 12, purchase: 75, selling: 110, mrp: 120, stock: 45, category: 'Nasal Care' },
  { name: 'Asthalin Inhaler', batch: 'AS8821', expiry: '2026-03-12', supplier: 'Cipla', gst: 12, purchase: 140, selling: 195, mrp: 210, stock: 25, category: 'Respiratory' },
  { name: 'Glycomet GP 1', batch: 'GL3301', expiry: '2027-01-01', supplier: 'USV Ltd', gst: 12, purchase: 95, selling: 145, mrp: 160, stock: 85, category: 'Diabetes' },
  { name: 'Spasmo-Proxyvon', batch: 'SP1102', expiry: '2028-04-10', supplier: 'Wockhardt', gst: 12, purchase: 45, selling: 75, mrp: 85, stock: 6, category: 'Pain Relief' }, // Low stock
  { name: 'Atarax 25mg', batch: 'AT4412', expiry: '2026-12-20', supplier: 'UCB', gst: 12, purchase: 65, selling: 105, mrp: 120, stock: 8, category: 'Allergy' }, // Low stock
  // ... adding more to reach 50
];

// Helper to fill up to 50
for (let i = 22; i <= 50; i++) {
  MEDICINES.push({
    name: `General Medicine ${i}`,
    batch: `BT${1000 + i}`,
    expiry: '2027-12-31',
    supplier: i % 2 === 0 ? 'Pharma Link' : 'Global Meds',
    gst: 12,
    purchase: 50 + (i * 2),
    selling: 80 + (i * 2),
    mrp: 90 + (i * 2),
    stock: i % 5 === 0 ? 5 : 50 + i,
    category: 'General',
  });
}

export async function seed() {
  const db = await getDb();
  
  // Clear existing
  await db.exec(`DELETE FROM sale_items; DELETE FROM sales; DELETE FROM medicines; DELETE FROM users;`);

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin']);

  // Medicines
  for (const m of MEDICINES) {
    await db.run(`
      INSERT INTO medicines (name, batch_number, expiry_date, supplier, gst_percent, purchase_price, selling_price, mrp, stock, category, barcode, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.name, m.batch, m.expiry, m.supplier, m.gst, m.purchase, m.selling, m.mrp, m.stock, m.category, `BAR${Math.floor(Math.random()*1000000)}`, `https://picsum.photos/seed/${m.name}/200/200`]
    );
  }

  // Initial Sales History
  const meds = await db.all(`SELECT id, selling_price, gst_percent FROM medicines LIMIT 10`);
  for (let i = 0; i < 20; i++) {
    const totalAmount = 500 + Math.random() * 2000;
    const result = await db.run(`
      INSERT INTO sales (customer_name, customer_phone, total_amount, payment_method, timestamp)
      VALUES (?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 30)} days'))`,
      [`Customer ${i}`, `98765432${i % 10}${i % 10}`, totalAmount, i % 3 === 0 ? 'UPI' : 'Cash']
    );
    
    const saleId = result.lastID;
    const randomMed = meds[Math.floor(Math.random() * meds.length)];
    await db.run(`
      INSERT INTO sale_items (sale_id, medicine_id, quantity, price, gst_amount)
      VALUES (?, ?, ?, ?, ?)`,
      [saleId, randomMed.id, 2, randomMed.selling_price, (randomMed.selling_price * 2 * randomMed.gst_percent) / 100]
    );
  }

  console.log('Seeding complete!');
}
