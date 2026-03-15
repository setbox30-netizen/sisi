import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('masjid.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'income' or 'expense'
    amount REAL,
    category TEXT,
    date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    quantity INTEGER,
    condition TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS pengurus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    position TEXT,
    phone TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('warga', 'warga123', 'warga');
  
  // Initial transactions
  db.prepare('INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)').run('income', 5000000, 'Infaq Jumat', '2024-03-01', 'Infaq rutin jumat');
  db.prepare('INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)').run('expense', 1200000, 'Listrik', '2024-03-02', 'Bayar listrik bulanan');
  
  // Initial inventory
  db.prepare('INSERT INTO inventory (name, quantity, condition, location) VALUES (?, ?, ?, ?)').run('Sound System', 1, 'Baik', 'Ruang Utama');
  db.prepare('INSERT INTO inventory (name, quantity, condition, location) VALUES (?, ?, ?, ?)').run('Karpet', 20, 'Baik', 'Ruang Utama');
  
  // Initial pengurus
  db.prepare('INSERT INTO pengurus (name, position, phone, email) VALUES (?, ?, ?, ?)').run('H. Ahmad', 'Ketua DKM', '08123456789', 'ahmad@example.com');
  db.prepare('INSERT INTO pengurus (name, position, phone, email) VALUES (?, ?, ?, ?)').run('Ust. Yusuf', 'Sekretaris', '08129876543', 'yusuf@example.com');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Auth API
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Dashboard API
  app.get('/api/dashboard', (req, res) => {
    const income = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get() as any;
    const expense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get() as any;
    const totalIncome = income.total || 0;
    const totalExpense = expense.total || 0;
    const balance = totalIncome - totalExpense;

    const recentTransactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC LIMIT 5').all();
    
    res.json({ balance, totalIncome, totalExpense, recentTransactions });
  });

  // Finance API
  app.get('/api/transactions', (req, res) => {
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    res.json(transactions);
  });

  app.post('/api/transactions', (req, res) => {
    const { type, amount, category, date, description } = req.body;
    db.prepare('INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)').run(type, amount, category, date, description);
    res.json({ success: true });
  });

  app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, category, date, description } = req.body;
    db.prepare('UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ?').run(type, amount, category, date, description, id);
    res.json({ success: true });
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Inventory API
  app.get('/api/inventory', (req, res) => {
    const items = db.prepare('SELECT * FROM inventory').all();
    res.json(items);
  });

  app.post('/api/inventory', (req, res) => {
    const { name, quantity, condition, location } = req.body;
    db.prepare('INSERT INTO inventory (name, quantity, condition, location) VALUES (?, ?, ?, ?)').run(name, quantity, condition, location);
    res.json({ success: true });
  });

  // Pengurus API
  app.get('/api/pengurus', (req, res) => {
    const members = db.prepare('SELECT * FROM pengurus').all();
    res.json(members);
  });

  app.post('/api/pengurus', (req, res) => {
    const { name, position, phone, email } = req.body;
    db.prepare('INSERT INTO pengurus (name, position, phone, email) VALUES (?, ?, ?, ?)').run(name, position, phone, email);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
