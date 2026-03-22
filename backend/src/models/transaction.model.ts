import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Types
// ============================================================

export interface Transaction {
  id: string;
  amount: number;
  amountUSD: number;
  category: string;
  subcategory?: string;
  date: string;
  location?: string;
  merchant?: string;
  isOnline: boolean;
  receiptImageUrl?: string;
  currency: string;
  notes?: string;
  tags?: string[];
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionDB {
  transactions: Transaction[];
}

// ============================================================
// Database
// ============================================================

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'transactions.json');

let db: Low<TransactionDB>;

function getDB(): Low<TransactionDB> {
  if (!db) {
    const adapter = new JSONFileSync<TransactionDB>(DB_FILE);
    db = new Low(adapter, { transactions: [] });
    db.read();
  }
  return db;
}

// ============================================================
// Transaction Model
// ============================================================

export const TransactionModel = {
  getAll(filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const db = getDB();
    let transactions = [...db.data.transactions];

    if (filters?.startDate) {
      transactions = transactions.filter((t) => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      transactions = transactions.filter((t) => t.date <= filters.endDate!);
    }
    if (filters?.category) {
      transactions = transactions.filter((t) => t.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.merchant?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = transactions.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;
    const items = transactions.slice(offset, offset + limit);

    return { items, total, page, limit, hasMore: offset + limit < total };
  },

  getById(id: string): Transaction | undefined {
    const db = getDB();
    return db.data.transactions.find((t) => t.id === id);
  },

  create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const db = getDB();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    db.data.transactions.push(transaction);
    db.write();
    return transaction;
  },

  update(id: string, updates: Partial<Transaction>): Transaction | null {
    const db = getDB();
    const index = db.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    db.data.transactions[index] = {
      ...db.data.transactions[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    db.write();
    return db.data.transactions[index];
  },

  delete(id: string): boolean {
    const db = getDB();
    const index = db.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;

    db.data.transactions.splice(index, 1);
    db.write();
    return true;
  },

  getSummary(period: 'week' | 'month' | 'year') {
    const db = getDB();
    const now = new Date();
    const cutoff = new Date();

    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else cutoff.setFullYear(now.getFullYear() - 1);

    const filtered = db.data.transactions.filter(
      (t) => new Date(t.date) >= cutoff
    );

    const total = filtered.reduce((sum, t) => sum + t.amountUSD, 0);

    const byCategory: Record<string, { amount: number; count: number }> = {};
    filtered.forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { amount: 0, count: 0 };
      }
      byCategory[t.category].amount += t.amountUSD;
      byCategory[t.category].count += 1;
    });

    const categoryList = Object.entries(byCategory)
      .map(([name, data]) => ({ category: name, ...data }))
      .sort((a, b) => b.amount - a.amount);

    // Trend data (group by day)
    const trendMap: Record<string, number> = {};
    filtered.forEach((t) => {
      trendMap[t.date] = (trendMap[t.date] || 0) + t.amountUSD;
    });
    const trend = Object.entries(trendMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, byCategory: categoryList, trend };
  },
};

export default TransactionModel;
