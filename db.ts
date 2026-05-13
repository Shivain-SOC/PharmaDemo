import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: path.join(process.cwd(), 'pharmacy.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      batch_number TEXT,
      expiry_date TEXT,
      supplier TEXT,
      gst_percent REAL,
      purchase_price REAL,
      selling_price REAL,
      mrp REAL,
      stock INTEGER DEFAULT 0,
      category TEXT,
      barcode TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      total_amount REAL,
      payment_method TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      medicine_id INTEGER,
      quantity INTEGER,
      price REAL,
      gst_amount REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );
  `);

  return db;
}
