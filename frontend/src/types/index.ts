// ============================================
// Core Financial Types
// ============================================

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'BRL';

export type TransactionCategory =
  | 'Housing'
  | 'Food & Dining'
  | 'Transportation'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Education'
  | 'Utilities'
  | 'Travel'
  | 'Personal Care'
  | 'Insurance'
  | 'Investments'
  | 'Savings'
  | 'Debt Payment'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  amountUSD: number;
  category: TransactionCategory;
  subcategory?: string;
  date: string; // ISO date string
  location?: string;
  merchant?: string;
  isOnline: boolean;
  receiptImageUrl?: string;
  currency: Currency;
  notes?: string;
  tags?: string[];
  lineItems?: LineItem[];
  paymentMethod?: 'cash' | 'credit' | 'debit' | 'transfer' | 'crypto' | 'other';
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type IncomeFrequency = 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
export type IncomeSource = 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'pension' | 'gift' | 'other';

export interface Income {
  id: string;
  amount: number;
  amountUSD: number;
  source: IncomeSource;
  sourceName?: string;
  date: string;
  frequency: IncomeFrequency;
  currency: Currency;
  country?: string;
  profession?: string;
  level?: ProfessionLevel;
  notes?: string;
  isRecurring: boolean;
}

export type InvestmentType =
  | 'stocks'
  | 'bonds'
  | 'etf'
  | 'crypto'
  | 'real-estate'
  | 'commodities'
  | 'mutual-fund'
  | 'options'
  | 'forex'
  | 'cash'
  | 'other';

export interface Investment {
  id: string;
  type: InvestmentType;
  symbol?: string;
  name: string;
  amount: number; // Current value
  amountUSD: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  date: string; // Purchase date
  platform?: string;
  currency: Currency;
  notes?: string;
  sector?: string;
  country?: string;
}

export interface InvestmentPerformance {
  investment: Investment;
  gain: number;
  gainPercent: number;
  annualizedReturn: number;
}

// ============================================
// Economic Data Types
// ============================================

export interface EconomicData {
  country: string;
  countryCode: string;
  city?: string;
  gdpGrowth: number; // percentage
  inflation: number; // percentage
  unemploymentRate: number; // percentage
  averageIncome: number; // monthly, USD
  costOfLiving: CostOfLiving;
  interestRate: number; // central bank rate
  currencyStrength?: number;
  lastUpdated: string;
}

export interface CostOfLiving {
  overall: number; // index vs NYC = 100
  rent: number;
  groceries: number;
  transportation: number;
  utilities: number;
  dining: number;
  healthcare: number;
  entertainment: number;
}

export interface ProfessionBenchmark {
  profession: string;
  level: ProfessionLevel;
  country: string;
  city?: string;
  averageMonthlyIncome: number; // USD
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export type ProfessionLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive';

export type ProfessionCategory =
  | 'Software Engineering'
  | 'Product Management'
  | 'Data Science'
  | 'Design'
  | 'Marketing'
  | 'Finance'
  | 'Healthcare'
  | 'Education'
  | 'Legal'
  | 'Consulting'
  | 'Sales'
  | 'Operations'
  | 'HR'
  | 'Other';

// ============================================
// Kondratiev Wave
// ============================================

export enum KondratievPhase {
  Spring = 'Spring',
  Summer = 'Summer',
  Autumn = 'Autumn',
  Winter = 'Winter',
}

export interface KondratievWave {
  waveNumber: number;
  name: string;
  startYear: number;
  endYear: number;
  phases: {
    spring: { start: number; end: number };
    summer: { start: number; end: number };
    autumn: { start: number; end: number };
    winter: { start: number; end: number };
  };
  drivingForce: string;
  keyInnovations: string[];
}

export interface EconomicCyclePosition {
  kondratievPhase: KondratievPhase;
  kondratievWave: number;
  kondratievYear: number; // Year within wave (0-100%)
  businessCycle: 'Expansion' | 'Peak' | 'Contraction' | 'Trough';
  debtCycle: 'Early' | 'Mid' | 'Late' | 'Deleveraging'; // Ray Dalio
  yieldCurveStatus: 'Normal' | 'Flat' | 'Inverted';
  implication: string;
  investmentStrategy: string[];
}

// ============================================
// AI Analysis Types
// ============================================

export interface SpendingAnalysis {
  total: number;
  vsLastPeriod: number; // percentage change
  vsBudget: number; // percentage of budget used
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    vsPreviousPeriod?: number;
  }>;
  anomalies: string[];
  insights: string;
  dailyAverage: number;
  projectedMonthly: number;
}

export interface IncomeAnalysis {
  total: number;
  vsProfessionBenchmark: number; // percentage vs median
  vsCityMedian: number;
  sources: Array<{ name: string; amount: number; percentage: number }>;
  insights: string;
  netIncome: number;
  savingsRate: number;
}

export interface InvestmentAnalysisReport {
  totalReturn: number; // percentage
  totalReturnAmount: number;
  vsMarket: number; // percentage vs S&P 500
  allocation: Array<{ asset: string; percentage: number; targetPercentage?: number }>;
  rebalancingNeeded: boolean;
  rebalancingDetails?: string;
  insights: string;
  sharpeRatio?: number;
  volatility?: number;
}

export interface EconomicContext {
  kondratievPhase: KondratievPhase;
  businessCycle: 'Expansion' | 'Peak' | 'Contraction' | 'Trough';
  inflationImpact: string;
  opportunities: string[];
  risks: string[];
  outlook: string;
}

export interface ActionItem {
  priority: number;
  action: string;
  impact: 'High' | 'Medium' | 'Low';
  category: 'spending' | 'saving' | 'investing' | 'income' | 'tax' | 'risk';
  deadline?: string;
}

export interface RiskAlert {
  level: 'High' | 'Medium' | 'Low';
  description: string;
  category: string;
  recommendation?: string;
}

export interface FinancialScore {
  overall: number; // 0-100
  spending: number;
  saving: number;
  investing: number;
  debtManagement: number;
  emergencyFund: number;
}

export interface AIAnalysis {
  reportId: string;
  generatedAt: string;
  period: { start: string; end: string };
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  executiveSummary: string;
  spendingAnalysis: SpendingAnalysis;
  incomeAnalysis: IncomeAnalysis;
  investmentPerformance: InvestmentAnalysisReport;
  economicContext: EconomicContext;
  actionItems: ActionItem[];
  riskAlerts: RiskAlert[];
  score: FinancialScore;
  nextReportDate?: string;
}

// ============================================
// User Settings Types
// ============================================

export interface UserSettings {
  userId?: string;
  country: string;
  countryCode: string;
  city: string;
  profession: ProfessionCategory;
  professionLevel: ProfessionLevel;
  currency: Currency;
  targetMonthlyExpense: number;
  targetMonthlySaving: number;
  targetInvestmentAllocation: number; // percentage of income
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  theme: 'dark' | 'light';
  notifications: NotificationSettings;
  apiKeys?: ApiKeys;
  language: string;
  weeklyReportDay: number; // 0=Sunday, 1=Monday...
  weeklyReportHour: number;
}

export interface NotificationSettings {
  weeklyReport: boolean;
  budgetAlerts: boolean;
  investmentAlerts: boolean;
  riskAlerts: boolean;
  economicUpdates: boolean;
  expenseReminders: boolean;
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  fredApiKey?: string;
  googleVision?: string;
  numbeoApiKey?: string;
}

// ============================================
// UI / Navigation Types
// ============================================

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | '5years' | '10years';

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    cash: number;
    investments: number;
    realEstate: number;
    other: number;
    debt: number;
  };
}

export interface BudgetProgress {
  category: TransactionCategory;
  budgeted: number;
  spent: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'over-budget';
}

export interface GoalProgress {
  id: string;
  name: string;
  type: 'saving' | 'debt-payoff' | 'investment' | 'expense-reduction';
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDate?: string;
  monthlyContribution?: number;
  status: 'on-track' | 'behind' | 'achieved';
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ParsedReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  date?: string;
  time?: string;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  currency?: Currency;
  lineItems?: LineItem[];
  paymentMethod?: string;
  confidence: number; // 0-1
  rawText?: string;
}

// ============================================
// Country Data
// ============================================

export interface Country {
  name: string;
  code: string;
  flag: string;
  currency: Currency;
  continent: string;
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', flag: '🇺🇸', currency: 'USD', continent: 'Americas' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', currency: 'GBP', continent: 'Europe' },
  { name: 'European Union', code: 'EU', flag: '🇪🇺', currency: 'EUR', continent: 'Europe' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', currency: 'EUR', continent: 'Europe' },
  { name: 'France', code: 'FR', flag: '🇫🇷', currency: 'EUR', continent: 'Europe' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', currency: 'JPY', continent: 'Asia' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', currency: 'CAD', continent: 'Americas' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', currency: 'AUD', continent: 'Oceania' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', currency: 'CHF', continent: 'Europe' },
  { name: 'China', code: 'CN', flag: '🇨🇳', currency: 'CNY', continent: 'Asia' },
  { name: 'India', code: 'IN', flag: '🇮🇳', currency: 'INR', continent: 'Asia' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', currency: 'BRL', continent: 'Americas' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', currency: 'USD', continent: 'Asia' },
  { name: 'UAE', code: 'AE', flag: '🇦🇪', currency: 'USD', continent: 'Asia' },
];

// ============================================
// Mock Data
// ============================================

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 2800,
    amountUSD: 2800,
    category: 'Housing',
    subcategory: 'Rent',
    date: '2026-03-01',
    merchant: 'Apartment Management',
    isOnline: false,
    currency: 'USD',
    notes: 'Monthly rent',
    tags: ['fixed', 'housing'],
    paymentMethod: 'transfer',
  },
  {
    id: '2',
    amount: 89.50,
    amountUSD: 89.50,
    category: 'Food & Dining',
    subcategory: 'Groceries',
    date: '2026-03-15',
    merchant: 'Whole Foods Market',
    location: 'San Francisco, CA',
    isOnline: false,
    currency: 'USD',
    tags: ['groceries'],
    paymentMethod: 'credit',
  },
  {
    id: '3',
    amount: 45.00,
    amountUSD: 45.00,
    category: 'Transportation',
    subcategory: 'Rideshare',
    date: '2026-03-18',
    merchant: 'Uber',
    isOnline: true,
    currency: 'USD',
    paymentMethod: 'credit',
  },
  {
    id: '4',
    amount: 15.99,
    amountUSD: 15.99,
    category: 'Entertainment',
    subcategory: 'Streaming',
    date: '2026-03-10',
    merchant: 'Netflix',
    isOnline: true,
    currency: 'USD',
    paymentMethod: 'credit',
    tags: ['subscription'],
  },
  {
    id: '5',
    amount: 320.00,
    amountUSD: 320.00,
    category: 'Shopping',
    subcategory: 'Clothing',
    date: '2026-03-12',
    merchant: 'Nordstrom',
    location: 'San Francisco, CA',
    isOnline: false,
    currency: 'USD',
    paymentMethod: 'credit',
  },
];

export const MOCK_INCOME: Income[] = [
  {
    id: '1',
    amount: 12000,
    amountUSD: 12000,
    source: 'salary',
    sourceName: 'Tech Corp Inc.',
    date: '2026-03-01',
    frequency: 'monthly',
    currency: 'USD',
    country: 'US',
    profession: 'Software Engineering',
    level: 'senior',
    isRecurring: true,
  },
  {
    id: '2',
    amount: 2500,
    amountUSD: 2500,
    source: 'freelance',
    sourceName: 'Consulting Project',
    date: '2026-03-15',
    frequency: 'one-time',
    currency: 'USD',
    isRecurring: false,
  },
  {
    id: '3',
    amount: 450,
    amountUSD: 450,
    source: 'investment',
    sourceName: 'Dividend Income',
    date: '2026-03-20',
    frequency: 'quarterly',
    currency: 'USD',
    isRecurring: true,
  },
];

export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: '1',
    type: 'etf',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    amount: 45000,
    amountUSD: 45000,
    purchasePrice: 210.00,
    currentPrice: 245.50,
    quantity: 183,
    date: '2024-01-15',
    platform: 'Fidelity',
    currency: 'USD',
    sector: 'Broad Market',
  },
  {
    id: '2',
    type: 'stocks',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    amount: 18500,
    amountUSD: 18500,
    purchasePrice: 165.00,
    currentPrice: 185.00,
    quantity: 100,
    date: '2023-06-10',
    platform: 'Fidelity',
    currency: 'USD',
    sector: 'Technology',
  },
  {
    id: '3',
    type: 'crypto',
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 12000,
    amountUSD: 12000,
    purchasePrice: 42000,
    currentPrice: 68000,
    quantity: 0.1765,
    date: '2023-11-01',
    platform: 'Coinbase',
    currency: 'USD',
  },
  {
    id: '4',
    type: 'bonds',
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    amount: 8000,
    amountUSD: 8000,
    purchasePrice: 98.00,
    currentPrice: 95.00,
    quantity: 82,
    date: '2024-03-01',
    platform: 'Fidelity',
    currency: 'USD',
    sector: 'Fixed Income',
  },
];
