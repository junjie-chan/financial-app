import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Investment {
  id: string;
  type: string;
  symbol?: string;
  name: string;
  amount: number;
  amountUSD: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  date: string;
  platform?: string;
  currency: string;
  notes?: string;
  sector?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvestmentDB {
  investments: Investment[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'investments.json');

let db: Low<InvestmentDB>;

function getDB(): Low<InvestmentDB> {
  if (!db) {
    const adapter = new JSONFileSync<InvestmentDB>(DB_FILE);
    db = new Low(adapter, { investments: [] });
    db.read();
  }
  return db;
}

export const InvestmentModel = {
  getAll(): Investment[] {
    return [...getDB().data.investments];
  },

  getById(id: string): Investment | undefined {
    return getDB().data.investments.find((i) => i.id === id);
  },

  create(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Investment {
    const db = getDB();
    const now = new Date().toISOString();
    const investment: Investment = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    db.data.investments.push(investment);
    db.write();
    return investment;
  },

  update(id: string, updates: Partial<Investment>): Investment | null {
    const db = getDB();
    const index = db.data.investments.findIndex((i) => i.id === id);
    if (index === -1) return null;

    db.data.investments[index] = {
      ...db.data.investments[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    db.write();
    return db.data.investments[index];
  },

  delete(id: string): boolean {
    const db = getDB();
    const index = db.data.investments.findIndex((i) => i.id === id);
    if (index === -1) return false;
    db.data.investments.splice(index, 1);
    db.write();
    return true;
  },

  getPortfolioSummary() {
    const investments = getDB().data.investments;
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
    const totalCost = investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
    const totalGain = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const byType: Record<string, number> = {};
    investments.forEach((inv) => {
      byType[inv.type] = (byType[inv.type] || 0) + inv.currentPrice * inv.quantity;
    });

    return {
      totalValue,
      totalCost,
      totalGain,
      returnPct,
      allocation: Object.entries(byType).map(([type, value]) => ({
        type,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })),
      count: investments.length,
    };
  },
};

export default InvestmentModel;
