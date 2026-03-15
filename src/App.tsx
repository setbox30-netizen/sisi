import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Search,
  ChevronRight,
  Bell,
  User as UserIcon,
  Filter,
  Download,
  Calendar,
  Edit,
  Trash2,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, Role, DashboardData, Transaction, InventoryItem, PengurusMember } from './types';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---
const SidebarItem = ({ icon: Icon, label, to, active, onClick }: { icon: any, label: string, to: string, active: boolean, onClick?: () => void, key?: string }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
      active 
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200" 
        : "text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-600"
    )}
  >
    {active && (
      <motion.div 
        layoutId="active-bg"
        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 -z-10"
      />
    )}
    <Icon size={20} className={cn("transition-transform duration-300", active ? "" : "group-hover:scale-110 group-hover:rotate-3")} />
    <span className="font-semibold tracking-tight">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      />
    )}
  </Link>
);

const Card = ({ children, className, title, subtitle, action }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, action?: React.ReactNode, key?: any }) => (
  <div className={cn("bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 transition-all duration-300", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          {title && <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend?: { label: string, up: boolean }, color: 'emerald' | 'rose' | 'amber' | 'blue' }) => {
  const gradients = {
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-100/50",
    rose: "from-rose-500/10 to-orange-500/5 border-rose-100/50",
    amber: "from-amber-500/10 to-yellow-500/5 border-amber-100/50",
    blue: "from-blue-500/10 to-indigo-500/5 border-blue-100/50",
  };

  const iconColors = {
    emerald: "bg-emerald-500 text-white shadow-emerald-200",
    rose: "bg-rose-500 text-white shadow-rose-200",
    amber: "bg-amber-500 text-white shadow-amber-200",
    blue: "bg-blue-500 text-white shadow-blue-200",
  };

  return (
    <Card className={cn("flex flex-col gap-3 md:gap-4 bg-gradient-to-br border relative overflow-hidden group", gradients[color])}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="flex items-center justify-between relative z-10">
        <div className={cn("p-2.5 md:p-3 rounded-2xl shadow-lg", iconColors[color])}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md border", 
            trend.up ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50" : "bg-rose-500/10 text-rose-700 border-rose-200/50")}>
            {trend.up ? <TrendingUp size={10} className="md:w-3 md:h-3" /> : <TrendingDown size={10} className="md:w-3 md:h-3" />}
            {trend.label}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 tracking-tight">{value}</h2>
      </div>
    </Card>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="p-8 text-center">Loading...</div>;

  const chartData = [
    { name: 'Pemasukan', value: data.totalIncome, color: '#10b981' },
    { name: 'Pengeluaran', value: data.totalExpense, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-4xl font-black tracking-tight mb-2"
            >
              Assalamu'alaikum, <span className="text-emerald-400">{user?.username}</span>
            </motion.h1>
            <p className="text-slate-400 font-medium text-base md:text-lg">Selamat datang di dashboard SimaMasjid.</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-white/5 backdrop-blur-md p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            <button className="whitespace-nowrap px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold bg-emerald-500 text-white rounded-lg md:rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Hari Ini</button>
            <button className="whitespace-nowrap px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg md:rounded-xl transition-all">Minggu Ini</button>
            <button className="whitespace-nowrap px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg md:rounded-xl transition-all">Bulan Ini</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Saldo" 
          value={formatCurrency(data.balance)} 
          icon={Wallet} 
          color="blue"
          trend={{ label: "+12.5%", up: true }}
        />
        <StatCard 
          title="Total Pemasukan" 
          value={formatCurrency(data.totalIncome)} 
          icon={TrendingUp} 
          color="emerald"
        />
        <StatCard 
          title="Total Pengeluaran" 
          value={formatCurrency(data.totalExpense)} 
          icon={TrendingDown} 
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ringkasan Keuangan" subtitle="Perbandingan pemasukan dan pengeluaran">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Transaksi Terakhir" subtitle="5 transaksi terbaru" action={<Link to="/finance" className="text-emerald-600 text-sm font-semibold hover:underline">Lihat Semua</Link>}>
          <div className="space-y-4">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", tx.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                    {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{tx.category}</p>
                    <p className="text-xs text-slate-500">{format(new Date(tx.date), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Finance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(setTransactions);
  };

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const monthMatch = selectedMonth === 'all' || format(txDate, 'MM') === selectedMonth;
    const yearMatch = selectedYear === 'all' || format(txDate, 'yyyy') === selectedYear;
    return monthMatch && yearMatch;
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
    const method = editingTx ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        amount: Number(data.amount)
      })
    });
    
    setShowModal(false);
    setEditingTx(null);
    fetchTransactions();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
    }
  };

  const totals = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });
  const balance = totals.income - totals.expense;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(18);
    doc.text('Laporan Keuangan Masjid Al-Ikhlas', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, 30);

    // Summary Table (Rekap)
    autoTable(doc, {
      body: [
        [
          { content: 'REKAPITULASI KEUANGAN', colSpan: 3, styles: { halign: 'center', fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' } }
        ],
        [
          { content: 'Total Pemasukan', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } },
          { content: 'Total Pengeluaran', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } },
          { content: 'Saldo Akhir', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } }
        ],
        [
          { content: formatCurrency(totals.income), styles: { halign: 'center', textColor: [5, 150, 105], fontSize: 12, fontStyle: 'bold' } },
          { content: formatCurrency(totals.expense), styles: { halign: 'center', textColor: [220, 38, 38], fontSize: 12, fontStyle: 'bold' } },
          { content: formatCurrency(balance), styles: { halign: 'center', textColor: [37, 99, 235], fontSize: 12, fontStyle: 'bold' } }
        ]
      ],
      startY: 40,
      theme: 'grid',
      styles: { cellPadding: 5 },
    });

    const tableColumn = ["Tanggal", "Kategori", "Keterangan", "Tipe", "Jumlah"];
    const tableRows = filteredTransactions.map(tx => [
      format(new Date(tx.date), 'dd/MM/yyyy'),
      tx.category,
      tx.description,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      formatCurrency(tx.amount)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald-600
    });

    doc.save(`laporan_keuangan_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Print Only Header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-tight">LAPORAN KEUANGAN MASJID</h1>
        <p className="text-sm text-slate-600">Periode Data: {selectedMonth === 'all' ? 'Semua Data' : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}</p>
        <div className="mt-4 border-b-2 border-slate-900"></div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl shadow-emerald-200 print:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Laporan Keuangan</h1>
            <p className="text-emerald-50 font-medium text-base md:text-lg opacity-80">Kelola pemasukan dan pengeluaran masjid secara transparan.</p>
            
            {/* Filter Controls */}
            <div className="mt-6 flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-white/20">
                <Calendar size={14} className="text-emerald-100" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs md:text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="all" className="text-slate-800">Semua Bulan</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value} className="text-slate-800">{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-white/20">
                <Calendar size={14} className="text-emerald-100" />
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-xs md:text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="all" className="text-slate-800">Semua Tahun</option>
                  {years.map(y => (
                    <option key={y} value={y} className="text-slate-800">{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              type="button"
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold border border-white/20 hover:bg-white/20 active:scale-95 transition-all text-xs md:text-base"
            >
              <Printer size={18} className="md:w-5 md:h-5" />
              <span>Cetak</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold border border-white/20 hover:bg-white/20 active:scale-95 transition-all text-xs md:text-base"
            >
              <Download size={18} className="md:w-5 md:h-5 rotate-180" />
              <span>PDF</span>
            </button>
            {isAdmin && (
              <button 
                onClick={() => { setEditingTx(null); setShowModal(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-emerald-700 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-xl hover:bg-emerald-50 active:scale-95 transition-all text-xs md:text-base"
              >
                <Plus size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Tambah Transaksi</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print Only Summary - Matching Image Design */}
      <div className="hidden print:block mb-8">
        <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
            <Wallet size={18} />
            <span>Data Keuangan</span>
          </div>
          <div className="border border-slate-900 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900">
                  <th className="px-4 py-2 border-r border-slate-900 text-sm font-bold text-center w-24">Tanggal</th>
                  <th className="px-4 py-2 border-r border-slate-900 text-sm font-bold text-center">Keterangan</th>
                  <th className="px-4 py-2 border-r border-slate-900 text-sm font-bold text-center w-24">Jenis</th>
                  <th className="px-4 py-2 border-r border-slate-900 text-sm font-bold text-center w-32">Masuk (Rp)</th>
                  <th className="px-4 py-2 text-sm font-bold text-center w-32">Keluar (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-900">
                    <td className="px-4 py-2 border-r border-slate-900 text-xs text-center">{format(new Date(tx.date), 'd/M/yyyy')}</td>
                    <td className="px-4 py-2 border-r border-slate-900 text-xs">{tx.description}</td>
                    <td className="px-4 py-2 border-r border-slate-900 text-xs text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-bold text-white",
                        tx.type === 'income' ? "bg-emerald-600" : "bg-rose-600"
                      )}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-r border-slate-900 text-xs text-right">
                      {tx.type === 'income' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-xs text-right">
                      {tx.type === 'expense' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-slate-900 font-bold">
                  <td colSpan={3} className="px-4 py-2 border-r border-slate-900 text-sm text-right">Total</td>
                  <td className="px-4 py-2 border-r border-slate-900 text-sm text-right text-emerald-600">Rp {totals.income.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-sm text-right text-rose-600">Rp {totals.expense.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="font-bold bg-emerald-600 text-white">
                  <td colSpan={3} className="px-4 py-2 border-r border-slate-900 text-sm text-right bg-white text-slate-900">Saldo Akhir</td>
                  <td colSpan={2} className="px-4 py-2 text-sm text-center">
                    {balance < 0 ? '-' : ''}Rp {Math.abs(balance).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Pemasukan</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-800">{formatCurrency(totals.income)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
            <span>+12% Bulan ini</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <TrendingDown size={20} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Pengeluaran</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-800">{formatCurrency(totals.expense)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded-lg">
            <span>-5% Bulan ini</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Wallet size={20} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Saldo Akhir</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-800">{formatCurrency(balance)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
            <span>Kas Masjid Aman</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
          <p className="text-slate-500">Kelola pemasukan dan pengeluaran masjid.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
          >
            <Printer size={20} />
            <span className="hidden sm:inline">Cetak</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setEditingTx(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
            >
              <Plus size={20} />
              <span>Tambah Transaksi</span>
            </button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden p-0 print:border-none print:shadow-none !rounded-xl md:!rounded-[2rem]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">Keterangan</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">Tipe</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Jumlah</th>
                {isAdmin && <th className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest text-center print:hidden">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-emerald-50/30 even:bg-slate-50/50 transition-all duration-200 group">
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-medium text-slate-500">{format(new Date(tx.date), 'dd/MM/yy')}</td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-bold text-slate-900 tracking-tight">{tx.category}</td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm text-slate-600 leading-relaxed max-w-[150px] md:max-w-none truncate">{tx.description}</td>
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <span className={cn(
                      "px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider",
                      tx.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 md:px-6 py-4 md:py-5 text-sm md:text-base font-bold text-right tabular-nums whitespace-nowrap",
                    tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 md:px-6 py-4 md:py-5 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingTx(tx); setShowModal(true); }}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 md:p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingTx(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipe</label>
                  <select name="type" defaultValue={editingTx?.type || 'income'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah (IDR)</label>
                  <input name="amount" type="number" required defaultValue={editingTx?.amount} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                  <input name="category" type="text" required defaultValue={editingTx?.category} placeholder="Contoh: Infaq Jumat" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input name="date" type="date" required defaultValue={editingTx?.date || format(new Date(), 'yyyy-MM-dd')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan</label>
                  <textarea name="description" defaultValue={editingTx?.description} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none h-24"></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  {editingTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(setItems);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
    const method = editingItem ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        quantity: Number(data.quantity)
      })
    });
    
    setShowModal(false);
    setEditingItem(null);
    fetchInventory();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl shadow-blue-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Inventaris Masjid</h1>
            <p className="text-blue-50 font-medium text-base md:text-lg opacity-80">Daftar barang dan aset berharga milik masjid.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setEditingItem(null); setShowModal(true); }}
              className="flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl md:rounded-2xl font-bold shadow-xl hover:bg-blue-50 active:scale-95 transition-all text-sm md:text-base"
            >
              <Plus size={20} />
              <span>Tambah Barang</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map((item) => (
          <Card key={item.id} className="group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 relative overflow-hidden !p-5">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
              <div className="p-3 md:p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white shadow-sm transition-all duration-300 group-hover:rotate-6">
                <Package size={24} className="md:w-7 md:h-7" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-sm",
                  item.condition === 'Baik' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {item.condition}
                </span>
                {isAdmin && (
                  <div className="flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingItem(item); setShowModal(true); }}
                      className="p-2 bg-white text-blue-600 rounded-lg shadow-md border border-slate-100 hover:bg-blue-50 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-white text-rose-600 rounded-lg shadow-md border border-slate-100 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors relative z-10">{item.name}</h3>
            <div className="mt-4 md:mt-6 space-y-2 md:space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs md:text-sm bg-slate-50/50 p-2 rounded-xl">
                <span className="text-slate-500 font-medium">Jumlah</span>
                <span className="font-black text-slate-800">{item.quantity} Unit</span>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm bg-slate-50/50 p-2 rounded-xl">
                <span className="text-slate-500 font-medium">Lokasi</span>
                <span className="font-bold text-slate-700">{item.location}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingItem ? 'Edit Barang' : 'Tambah Barang'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Barang</label>
                  <input name="name" type="text" required defaultValue={editingItem?.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input name="quantity" type="number" required defaultValue={editingItem?.quantity} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kondisi</label>
                  <select name="condition" defaultValue={editingItem?.condition || 'Baik'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lokasi</label>
                  <input name="location" type="text" required defaultValue={editingItem?.location} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Barang'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Pengurus = () => {
  const [members, setMembers] = useState<PengurusMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<PengurusMember | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchPengurus();
  }, []);

  const fetchPengurus = () => {
    fetch('/api/pengurus')
      .then(res => res.json())
      .then(setMembers);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = editingMember ? `/api/pengurus/${editingMember.id}` : '/api/pengurus';
    const method = editingMember ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    setShowModal(false);
    setEditingMember(null);
    fetchPengurus();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengurus ini?')) {
      await fetch(`/api/pengurus/${id}`, { method: 'DELETE' });
      fetchPengurus();
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl shadow-amber-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Pengurus DKM</h1>
            <p className="text-amber-50 font-medium text-base md:text-lg opacity-80">Dedikasi pengurus untuk kemakmuran masjid kita.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setEditingMember(null); setShowModal(true); }}
              className="flex items-center justify-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-xl md:rounded-2xl font-bold shadow-xl hover:bg-amber-50 active:scale-95 transition-all text-sm md:text-base"
            >
              <Plus size={20} />
              <span>Tambah Pengurus</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {members.map((member) => (
          <Card key={member.id} className="text-center group hover:border-amber-200 transition-all duration-500 relative overflow-hidden !p-5">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                <UserIcon size={32} className="md:w-10 md:h-10" />
              </div>
              {isAdmin && (
                <div className="absolute top-0 right-0 flex flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingMember(member); setShowModal(true); }}
                    className="p-2 bg-white text-blue-600 rounded-xl shadow-md border border-slate-100 hover:bg-blue-50 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="p-2 bg-white text-rose-600 rounded-xl shadow-md border border-slate-100 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{member.name}</h3>
            <p className="text-amber-600 font-black text-[10px] md:text-xs uppercase tracking-widest mt-1 mb-4 md:mb-6">{member.position}</p>
            <div className="space-y-2 md:space-y-3 pt-4 md:pt-6 border-t border-slate-100 relative z-10">
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400" />
                {member.phone}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-400" />
                {member.email}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingMember ? 'Edit Pengurus' : 'Tambah Pengurus'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingMember(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input name="name" type="text" required defaultValue={editingMember?.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input name="position" type="text" required defaultValue={editingMember?.position} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">No. Telepon</label>
                  <input name="phone" type="text" required defaultValue={editingMember?.phone} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input name="email" type="email" required defaultValue={editingMember?.email} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  {editingMember ? 'Simpan Perubahan' : 'Simpan Pengurus'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsPage = () => {
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving
    setTimeout(() => {
      alert('Perubahan berhasil disimpan!');
    }, 500);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Pengaturan</h1>
          <p className="text-slate-300 font-medium text-base md:text-lg opacity-80">Konfigurasi sistem dan profil masjid Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Profil Masjid" subtitle="Informasi dasar identitas masjid" className="lg:col-span-2 relative overflow-hidden !p-6 md:!p-8">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl" />
          <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Masjid</label>
                <input type="text" defaultValue="Masjid Al-Ikhlas" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm md:text-base" />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Masjid</label>
                <input type="email" defaultValue="info@alikhlas.com" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm md:text-base" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Lengkap</label>
              <textarea defaultValue="Jl. Raya No. 123, Kota Bandung" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium h-24 md:h-32 resize-none text-sm md:text-base"></textarea>
            </div>
            <button type="submit" className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black shadow-xl shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all text-sm md:text-base">
              Simpan Perubahan
            </button>
          </form>
        </Card>

        <Card title="Sistem" subtitle="Konfigurasi teknis" className="relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <span className="text-sm font-bold text-slate-700">Notifikasi Email</span>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <span className="text-sm font-bold text-slate-700">Laporan Otomatis</span>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative shadow-inner cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <span className="text-sm font-bold text-slate-700">Backup Data</span>
              <button className="text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Jalankan</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ username, password });
    } catch (err) {
      setError('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-400/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-teal-400/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse delay-700"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[40px] p-6 md:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white/20">
          <div className="text-center mb-8 md:mb-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl md:rounded-[24px] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl shadow-emerald-200 ring-4 md:ring-8 ring-emerald-50">
              <LayoutDashboard size={32} className="md:w-10 md:h-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">Sima<span className="text-emerald-600">Masjid</span></h1>
            <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Sistem Manajemen Masjid Modern</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                placeholder="Masukkan username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                placeholder="Masukkan password"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Masuk...' : 'Masuk ke Aplikasi'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Demo: admin/admin123 atau warga/warga123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Wallet, label: 'Keuangan', to: '/finance' },
    { icon: Package, label: 'Inventaris', to: '/inventory' },
    { icon: Users, label: 'Pengurus', to: '/pengurus' },
    ...(isAdmin ? [{ icon: Settings, label: 'Pengaturan', to: '/settings' }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-emerald-50/30">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 p-6 sticky top-0 h-screen print:hidden">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 ring-4 ring-emerald-50">
            <LayoutDashboard size={24} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tighter">Sima<span className="text-emerald-600">Masjid</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 font-semibold hover:bg-rose-50 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                    <LayoutDashboard size={24} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">SimaMasjid</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <SidebarItem 
                    key={item.to} 
                    {...item} 
                    active={location.pathname === item.to} 
                    onClick={() => setIsSidebarOpen(false)}
                  />
                ))}
              </nav>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 font-semibold hover:bg-rose-50 rounded-xl transition-all"
                >
                  <LogOut size={20} />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 print:bg-white">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between print:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu size={20} className="md:w-6 md:h-6" />
          </button>

          <div className="hidden lg:flex items-center gap-3 bg-slate-100/50 border border-slate-200/50 rounded-2xl px-4 py-2.5 w-96 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Cari data, laporan, atau pengurus..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-medium" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 md:p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl md:rounded-2xl relative transition-all active:scale-90">
              <Bell size={18} className="md:w-5 md:h-5" />
              <span className="absolute top-2 md:top-2.5 right-2 md:right-2.5 w-2 md:w-2.5 h-2 md:h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
            <div className="h-6 md:h-8 w-px bg-slate-200 mx-0.5 md:mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs md:text-sm font-black text-slate-800 leading-none">{user?.username}</p>
                <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Administrator</p>
              </div>
              <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                <UserIcon size={18} className="md:w-[22px] md:h-[22px]" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: Role[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/pengurus" element={<ProtectedRoute><Pengurus /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
