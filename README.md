# PharmaSync SaaS 💊

PharmaSync is a premium, modern pharmacy management system designed for local pharmacy owners. It features an Apple-like minimal aesthetic, powerful inventory tracking, automated billing, and insightful analytics.

## 🚀 Key Features

- **Inventory Management**: Full CRUD with batch tracking, expiry monitoring, and categorization.
- **Low Stock Alerts**: Automated flagging and reordering recommendations.
- **Modern Billing**: Rapid checkout with GST calculations, discount support, and payment tracking.
- **WhatsApp Simulation**: Send formatted invoices directly to customers via WhatsApp.
- **Detailed Analytics**: Track revenue trends, top-selling items, and stock movement.
- **JWT Authentication**: Secure login/logout with role-based protection.
- **Responsive Design**: Works beautifully on Desktop, iPad, and Mobile.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: Node.js (Express), JSON Web Tokens (JWT).
- **Database**: SQLite with SQLAlchemy-like patterns.
- **Charts**: Recharts for data visualization.

## 📂 Project Structure

```text
├── server.ts          # Main Express server entry point
├── db.ts              # Database configuration & schema
├── seed.ts            # Seed script with 50+ demo medicines
├── src/               # React Frontend source
│   ├── pages/         # Dashboard, Inventory, Billing, Analytics, Login
│   ├── components/    # Reusable UI elements
│   ├── lib/           # API utilities
│   └── App.tsx        # Main routing & layout
├── Dockerfile         # Docker configuration
└── .env.example       # Environment variable template
```

## 📦 Setup & Installation

### Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The server will automatically initialize the SQLite database and seed it with demo data.

3. **Access the App**:
   Open `http://localhost:3000` in your browser.
   **Login**: `admin` / `admin123`

### Docker Setup

1. **Build Image**:
   ```bash
   docker build -t pharmasync .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 pharmasync
   ```

## 🌍 Deployment

### Vercel / Railway / Render
- Set the build command to `npm run build`.
- Set the start command to `node server.ts`.
- Ensure `JWT_SECRET` is set in environment variables.

---
Created with ❤️ for modern pharmacy owners.
