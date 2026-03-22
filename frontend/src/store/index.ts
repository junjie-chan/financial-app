import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Income,
  Investment,
  UserSettings,
  EconomicData,
  AIAnalysis,
  TimeGranularity,
  MOCK_TRANSACTIONS,
  MOCK_INCOME,
  MOCK_INVESTMENTS,
  KondratievPhase,
  ProfessionCategory,
  ProfessionLevel,
} from '../types';

// ============================================================
// Default Settings
// ============================================================

const DEFAULT_SETTINGS: UserSettings = {
  country: 'United States',
  countryCode: 'US',
  city: 'San Francisco',
  profession: 'Software Engineering' as ProfessionCategory,
  professionLevel: 'senior' as ProfessionLevel,
  currency: 'USD',
  targetMonthlyExpense: 5000,
  targetMonthlySaving: 3000,
  targetInvestmentAllocation: 20,
  riskTolerance: 'moderate',
  theme: 'dark',
  notifications: {
    weeklyReport: true,
    budgetAlerts: true,
    investmentAlerts: true,
    riskAlerts: true,
    economicUpdates: false,
    expenseReminders: true,
  },
  language: 'en',
  weeklyReportDay: 1, // Monday
  weeklyReportHour: 8,
};

const MOCK_ECONOMIC_DATA: EconomicData = {
  country: 'United States',
  countryCode: 'US',
  city: 'San Francisco',
  gdpGrowth: 2.8,
  inflation: 3.2,
  unemploymentRate: 3.9,
  averageIncome: 8500, // monthly USD
  costOfLiving: {
    overall: 94,
    rent: 3200,
    groceries: 650,
    transportation: 180,
    utilities: 220,
    dining: 22,
    healthcare: 450,
    entertainment: 200,
  },
  interestRate: 5.25,
  lastUpdated: new Date().toISOString(),
};

const MOCK_ANALYSIS: AIAnalysis = {
  reportId: 'report-001',
  generatedAt: new Date().toISOString(),
  period: {
    start: '2026-03-16',
    end: '2026-03-22',
  },
  periodType: 'weekly',
  executiveSummary:
    'This week showed moderate spending discipline with a 12% reduction vs last week. Your investment portfolio gained 2.3% outperforming the S&P 500. Key focus areas: housing costs remain high relative to income, and your emergency fund is below the recommended 6-month threshold.',
  spendingAnalysis: {
    total: 3270.49,
    vsLastPeriod: -11.8,
    vsBudget: 65.4,
    topCategories: [
      { name: 'Housing', amount: 2800, percentage: 55.6, vsPreviousPeriod: 0 },
      { name: 'Shopping', amount: 320, percentage: 9.8, vsPreviousPeriod: 25 },
      { name: 'Food & Dining', amount: 89.50, percentage: 2.7, vsPreviousPeriod: -15 },
      { name: 'Transportation', amount: 45, percentage: 1.4, vsPreviousPeriod: 5 },
    ],
    anomalies: ['Shopping spend 25% above monthly average', 'No restaurant spending this week - positive trend'],
    insights:
      'Your housing costs at 55.6% of total spending significantly exceed the recommended 30% guideline. Consider exploring options to reduce this burden over the next 6-12 months.',
    dailyAverage: 467.21,
    projectedMonthly: 14089,
  },
  incomeAnalysis: {
    total: 14950,
    vsProfessionBenchmark: 18.5,
    vsCityMedian: 45.2,
    sources: [
      { name: 'Salary', amount: 12000, percentage: 80.3 },
      { name: 'Freelance', amount: 2500, percentage: 16.7 },
      { name: 'Investments', amount: 450, percentage: 3.0 },
    ],
    insights:
      'Your income is 18.5% above the senior Software Engineering benchmark for San Francisco. Diversification through freelance income adds positive income stability.',
    netIncome: 11679.51,
    savingsRate: 34.2,
  },
  investmentPerformance: {
    totalReturn: 8.7,
    totalReturnAmount: 7285,
    vsMarket: 2.3,
    allocation: [
      { asset: 'ETF (VTI)', percentage: 53.6, targetPercentage: 50 },
      { asset: 'Stocks (AAPL)', percentage: 22.0, targetPercentage: 20 },
      { asset: 'Crypto (BTC)', percentage: 14.3, targetPercentage: 10 },
      { asset: 'Bonds (TLT)', percentage: 10.1, targetPercentage: 20 },
    ],
    rebalancingNeeded: true,
    rebalancingDetails:
      'Crypto allocation (14.3%) exceeds target (10%). Consider trimming $350 in BTC and adding to bonds to restore target allocation.',
    insights:
      'Portfolio outperformed S&P 500 by 2.3% this week. Bond allocation below target given current Kondratiev Winter phase - consider increasing fixed income exposure.',
    sharpeRatio: 1.42,
    volatility: 12.8,
  },
  economicContext: {
    kondratievPhase: KondratievPhase.Autumn,
    businessCycle: 'Contraction',
    inflationImpact:
      'At 3.2%, inflation is eroding purchasing power by approximately $384/month in real terms on your spending level. Inflation-protected assets and real assets are recommended.',
    opportunities: [
      'High-yield savings accounts offering 5%+ APY in current rate environment',
      'Real asset accumulation (REITs, commodities) as inflation hedge',
      'Value stocks in defensive sectors typically outperform in late cycle',
      'I-Bonds and TIPS for inflation protection',
    ],
    risks: [
      'Potential recession signals in yield curve inversion',
      'High tech concentration in portfolio during potential Kondratiev Winter',
      'Housing costs leaving limited margin for unexpected expenses',
    ],
    outlook:
      'Late Autumn / Early Winter Kondratiev phase suggests cautious positioning. Preserve capital, reduce speculative assets, increase cash and real assets over next 12-18 months.',
  },
  actionItems: [
    {
      priority: 1,
      action: 'Build emergency fund to 6-month expenses ($30,000) - currently estimated at 2 months',
      impact: 'High',
      category: 'saving',
      deadline: '2026-09-22',
    },
    {
      priority: 2,
      action: 'Rebalance portfolio: reduce crypto by $350, add to bonds for Kondratiev Winter positioning',
      impact: 'High',
      category: 'investing',
      deadline: '2026-03-29',
    },
    {
      priority: 3,
      action: 'Explore housing cost reduction strategies (negotiate lease, consider relocating)',
      impact: 'High',
      category: 'spending',
    },
    {
      priority: 4,
      action: 'Open high-yield savings account to capture 5%+ APY on emergency fund',
      impact: 'Medium',
      category: 'saving',
      deadline: '2026-04-01',
    },
    {
      priority: 5,
      action: 'Track all food expenses this week - budget creeping above target',
      impact: 'Low',
      category: 'spending',
    },
  ],
  riskAlerts: [
    {
      level: 'High',
      description: 'Emergency fund insufficient: only ~2 months of expenses covered',
      category: 'Liquidity Risk',
      recommendation: 'Prioritize building to $25,000-30,000 in high-yield savings',
    },
    {
      level: 'Medium',
      description: 'Crypto allocation exceeds risk-adjusted target by 43%',
      category: 'Portfolio Risk',
      recommendation: 'Reduce BTC position and rebalance into bonds',
    },
    {
      level: 'Medium',
      description: 'Housing cost ratio at 55.6% (recommended max 30%) limits financial flexibility',
      category: 'Cash Flow Risk',
      recommendation: 'Explore cost reduction in next lease renewal',
    },
  ],
  score: {
    overall: 72,
    spending: 68,
    saving: 58,
    investing: 81,
    debtManagement: 90,
    emergencyFund: 35,
  },
  nextReportDate: '2026-03-29',
};

// ============================================================
// Store Interface
// ============================================================

interface FinancialStore {
  // State
  transactions: Transaction[];
  income: Income[];
  investments: Investment[];
  settings: UserSettings;
  economicData: EconomicData | null;
  analyses: AIAnalysis[];
  latestAnalysis: AIAnalysis | null;
  isLoading: boolean;
  error: string | null;
  selectedGranularity: TimeGranularity;
  isInitialized: boolean;

  // Transaction Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setTransactions: (transactions: Transaction[]) => void;

  // Income Actions
  addIncome: (income: Income) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  setIncome: (income: Income[]) => void;

  // Investment Actions
  addInvestment: (investment: Investment) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  setInvestments: (investments: Investment[]) => void;

  // Settings Actions
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Economic Data Actions
  setEconomicData: (data: EconomicData) => void;

  // Analysis Actions
  addAnalysis: (analysis: AIAnalysis) => void;
  setLatestAnalysis: (analysis: AIAnalysis) => void;

  // UI State Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGranularity: (granularity: TimeGranularity) => void;

  // Init
  initializeStore: () => Promise<void>;
  saveToStorage: () => Promise<void>;

  // Computed
  getTotalExpenses: (period?: 'week' | 'month' | 'year') => number;
  getTotalIncome: (period?: 'week' | 'month' | 'year') => number;
  getTotalInvestmentValue: () => number;
  getNetWorth: () => number;
  getSavingsRate: () => number;
}

// ============================================================
// Helper: Filter by period
// ============================================================

function filterByPeriod<T extends { date: string }>(
  items: T[],
  period?: 'week' | 'month' | 'year'
): T[] {
  if (!period) return items;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'week') cutoff.setDate(now.getDate() - 7);
  else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
  else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1);
  return items.filter((item) => new Date(item.date) >= cutoff);
}

// ============================================================
// Zustand Store
// ============================================================

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  // Initial State
  transactions: MOCK_TRANSACTIONS,
  income: MOCK_INCOME,
  investments: MOCK_INVESTMENTS,
  settings: DEFAULT_SETTINGS,
  economicData: MOCK_ECONOMIC_DATA,
  analyses: [MOCK_ANALYSIS],
  latestAnalysis: MOCK_ANALYSIS,
  isLoading: false,
  error: null,
  selectedGranularity: 'monthly',
  isInitialized: false,

  // Transaction Actions
  addTransaction: (transaction) => {
    set((state) => ({ transactions: [transaction, ...state.transactions] }));
    get().saveToStorage();
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
    get().saveToStorage();
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().saveToStorage();
  },

  setTransactions: (transactions) => set({ transactions }),

  // Income Actions
  addIncome: (income) => {
    set((state) => ({ income: [income, ...state.income] }));
    get().saveToStorage();
  },

  updateIncome: (id, updates) => {
    set((state) => ({
      income: state.income.map((inc) =>
        inc.id === id ? { ...inc, ...updates } : inc
      ),
    }));
    get().saveToStorage();
  },

  deleteIncome: (id) => {
    set((state) => ({
      income: state.income.filter((inc) => inc.id !== id),
    }));
    get().saveToStorage();
  },

  setIncome: (income) => set({ income }),

  // Investment Actions
  addInvestment: (investment) => {
    set((state) => ({ investments: [investment, ...state.investments] }));
    get().saveToStorage();
  },

  updateInvestment: (id, updates) => {
    set((state) => ({
      investments: state.investments.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    }));
    get().saveToStorage();
  },

  deleteInvestment: (id) => {
    set((state) => ({
      investments: state.investments.filter((inv) => inv.id !== id),
    }));
    get().saveToStorage();
  },

  setInvestments: (investments) => set({ investments }),

  // Settings
  updateSettings: (updates) => {
    set((state) => ({ settings: { ...state.settings, ...updates } }));
    get().saveToStorage();
  },

  // Economic Data
  setEconomicData: (data) => set({ economicData: data }),

  // Analysis
  addAnalysis: (analysis) => {
    set((state) => ({
      analyses: [analysis, ...state.analyses],
      latestAnalysis: analysis,
    }));
  },

  setLatestAnalysis: (analysis) => set({ latestAnalysis: analysis }),

  // UI State
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setGranularity: (granularity) => set({ selectedGranularity: granularity }),

  // Storage
  initializeStore: async () => {
    try {
      const stored = await AsyncStorage.getItem('@financial_app_data');
      if (stored) {
        const data = JSON.parse(stored);
        set({
          transactions: data.transactions || MOCK_TRANSACTIONS,
          income: data.income || MOCK_INCOME,
          investments: data.investments || MOCK_INVESTMENTS,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          analyses: data.analyses || [MOCK_ANALYSIS],
          latestAnalysis: data.latestAnalysis || MOCK_ANALYSIS,
        });
      }
    } catch (error) {
      console.log('Failed to load stored data, using defaults');
    }
    set({ isInitialized: true, economicData: MOCK_ECONOMIC_DATA });
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const data = {
        transactions: state.transactions,
        income: state.income,
        investments: state.investments,
        settings: state.settings,
        analyses: state.analyses.slice(0, 10), // Keep last 10 reports
        latestAnalysis: state.latestAnalysis,
      };
      await AsyncStorage.setItem('@financial_app_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  },

  // Computed Values
  getTotalExpenses: (period) => {
    const items = filterByPeriod(get().transactions, period);
    return items.reduce((sum, t) => sum + t.amountUSD, 0);
  },

  getTotalIncome: (period) => {
    const items = filterByPeriod(get().income, period);
    return items.reduce((sum, i) => sum + i.amountUSD, 0);
  },

  getTotalInvestmentValue: () => {
    return get().investments.reduce((sum, inv) => {
      return sum + inv.currentPrice * inv.quantity;
    }, 0);
  },

  getNetWorth: () => {
    const investmentValue = get().getTotalInvestmentValue();
    // Estimate cash savings = last 3 months income - expenses
    const monthlyIncome = get().getTotalIncome('month');
    const monthlyExpense = get().getTotalExpenses('month');
    const estimatedCash = Math.max(0, (monthlyIncome - monthlyExpense) * 3);
    return investmentValue + estimatedCash;
  },

  getSavingsRate: () => {
    const monthlyIncome = get().getTotalIncome('month');
    const monthlyExpense = get().getTotalExpenses('month');
    if (monthlyIncome <= 0) return 0;
    return ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100;
  },
}));

export default useFinancialStore;
