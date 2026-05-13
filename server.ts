import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './db.ts';
import { seed } from './seed.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_secret_key_123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB and Seed
  const db = await getDb();
  await seed();

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // 1. Auth API
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      res.json({ token, user: { username: user.username } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ status: 'ok' });
  });

  // 2. Inventory API
  app.get('/api/medicines', authenticateToken, async (req, res) => {
    const meds = await db.all('SELECT * FROM medicines ORDER BY name ASC');
    res.json(meds);
  });

  app.post('/api/medicines', authenticateToken, async (req, res) => {
    const m = req.body;
    const result = await db.run(`
      INSERT INTO medicines (name, batch_number, expiry_date, supplier, gst_percent, purchase_price, selling_price, mrp, stock, category, barcode, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.name, m.batch_number, m.expiry_date, m.supplier, m.gst_percent, m.purchase_price, m.selling_price, m.mrp, m.stock, m.category, m.barcode, m.image_url]
    );
    res.json({ id: result.lastID, ...m });
  });

  app.put('/api/medicines/:id', authenticateToken, async (req, res) => {
    const m = req.body;
    const { id } = req.params;
    await db.run(`
      UPDATE medicines SET 
        name=?, batch_number=?, expiry_date=?, supplier=?, gst_percent=?, 
        purchase_price=?, selling_price=?, mrp=?, stock=?, category=?, barcode=?
      WHERE id=?`,
      [m.name, m.batch_number, m.expiry_date, m.supplier, m.gst_percent, m.purchase_price, m.selling_price, m.mrp, m.stock, m.category, m.barcode, id]
    );
    res.json({ id, ...m });
  });

  app.delete('/api/medicines/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM medicines WHERE id = ?', [req.params.id]);
    res.json({ status: 'ok' });
  });

  // 3. Billing / Checkout API
  app.post('/api/sales', authenticateToken, async (req, res) => {
    const { customerName, customerPhone, items, totalAmount, paymentMethod } = req.body;
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    try {
      const result = await db.run(`
        INSERT INTO sales (customer_name, customer_phone, total_amount, payment_method)
        VALUES (?, ?, ?, ?)`, 
        [customerName, customerPhone, totalAmount, paymentMethod]
      );
      const saleId = result.lastID;

      for (const item of items) {
        await db.run(`
          INSERT INTO sale_items (sale_id, medicine_id, quantity, price, gst_amount)
          VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.id, item.quantity, item.selling_price, (item.selling_price * item.quantity * item.gst_percent) / 100]
        );

        // Update stock
        await db.run(`UPDATE medicines SET stock = stock - ? WHERE id = ?`, [item.quantity, item.id]);
      }

      await db.run('COMMIT');
      res.json({ id: saleId, status: 'success' });
    } catch (err) {
      await db.run('ROLLBACK');
      res.status(500).json({ error: 'Transaction failed' });
    }
  });

  // 4. Analytics API
  app.get('/api/analytics', authenticateToken, async (req, res) => {
    console.log('GET /api/analytics - Start');
    try {
      const daySales = await db.get(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date(timestamp) = date('now')`);
      const weekSales = await db.get(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date(timestamp) >= date('now', '-7 days')`);
      const monthSales = await db.get(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date(timestamp) >= date('now', '-30 days')`);
      
      const chartData = await db.all(`
        SELECT date(timestamp) as date, COALESCE(SUM(total_amount), 0) as amount 
        FROM sales 
        WHERE date(timestamp) >= date('now', '-30 days')
        GROUP BY date(timestamp)
        ORDER BY date ASC
      `);

      const topSelling = await db.all(`
        SELECT m.name, COALESCE(SUM(si.quantity), 0) as count
        FROM sale_items si
        JOIN medicines m ON si.medicine_id = m.id
        GROUP BY m.id
        ORDER BY count DESC
        LIMIT 5
      `);

      const lowStock = await db.all(`SELECT * FROM medicines WHERE stock <= 10`);
      const invCount = await db.get('SELECT COUNT(*) as count FROM medicines');

      const payload = {
        daily: Number(daySales?.total) || 0,
        weekly: Number(weekSales?.total) || 0,
        monthly: Number(monthSales?.total) || 0,
        chartData: (chartData || []).map(d => ({ ...d, amount: Number(d.amount) })),
        topSelling: (topSelling || []).map(t => ({ ...t, count: Number(t.count) })),
        lowStock: lowStock || [],
        totalInventory: invCount?.count || 0
      };
      
      console.log('GET /api/analytics - Success');
      res.json(payload);
    } catch (error) {
      console.error('Analytics Error:', error);
      res.status(500).json({ error: 'Failed to aggregate analytics' });
    }
  });

  app.get('/api/sales', authenticateToken, async (req, res) => {
    const sales = await db.all('SELECT * FROM sales ORDER BY timestamp DESC LIMIT 50');
    res.json(sales);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
