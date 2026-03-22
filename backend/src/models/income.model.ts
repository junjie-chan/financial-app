import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Income {
  id: string;
  amount: number;
  amountUSD: number;
  source: string;
  sourceName?: string;
  date: string;
  frequency: string;
  currency: string;
  country?: string;
  profession?: string;
  level?: string;
  notes?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IncomeDB {
  income: Income[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'income.json');

let db: Low<IncomeDB>;

function getDB(): Low<IncomeDB> {
  if (!db) {
    const adapter = new JSONFileSync<IncomeDB>(DB_FILE);
    db = new Low(adapter, { income: [] });
    db.read();
  }
  return db;
}

export const IncomeModel = {
  getAll(): Income[] {
    const db = getDB();
    return [...db.data.income].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  getById(id: string): Income | undefined {
    return getDB().data.income.find((i) => i.id === id);
  },

  create(data: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Income {
    const db = getDB();
    const now = new Date().toISOString();
    const income: Income = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    db.data.income.push(income);
    db.write();
    return income;
  },

  update(id: string, updates: Partial<Income>): Income | null {
    const db = getDB();
    const index = db.data.income.findIndex((i) => i.id === id);
    if (index === -1) return null;

    db.data.income[index] = {
      ...db.data.income[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    db.write();
    return db.data.income[index];
  },

  delete(id: string): boolean {
    const db = getDB();
    const index = db.data.income.findIndex((i) => i.id === id);
    if (index === -1) return false;
    db.data.income.splice(index, 1);
    db.write();
    return true;
  },

  getMonthlyTotal(): number {
    const items = getDB().data.income;
    const multipliers: Record<string, number> = {
      'one-time': 0,
      'daily': 30,
      'weekly': 4.33,
      'bi-weekly': 2.17,
      'monthly': 1,
      'quarterly': 0.333,
      'annually': 0.0833,
    };
    return items.reduce((sum, i) => sum + i.amountUSD * (multipliers[i.frequency] || 1), 0);
  },
};

export default IncomeModel;
