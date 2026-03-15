export type Role = 'admin' | 'warga';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  condition: string;
  location: string;
}

export interface PengurusMember {
  id: number;
  name: string;
  position: string;
  phone: string;
  email: string;
}

export interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: Transaction[];
}
