export interface User {
  username: string;
}

export interface Medicine {
  id: number;
  name: string;
  batch_number: string;
  expiry_date: string;
  supplier: string;
  gst_percent: number;
  purchase_price: number;
  selling_price: number;
  mrp: number;
  stock: number;
  category: string;
  barcode: string;
  image_url: string;
}

export interface Sale {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  timestamp: string;
}

export interface Analytics {
  daily: number;
  weekly: number;
  monthly: number;
  totalInventory: number;
  chartData: { date: string; amount: number }[];
  topSelling: { name: string; count: number }[];
  lowStock: Medicine[];
}
