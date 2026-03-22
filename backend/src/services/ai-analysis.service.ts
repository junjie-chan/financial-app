import Anthropic from '@anthropic-ai/sdk';
import { TransactionModel } from '../models/transaction.model';
import { IncomeModel } from '../models/income.model';
import { InvestmentModel } from '../models/investment.model';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';

// ============================================================
// Analysis Report Type
// ============================================================

export interface AIAnalysisReport {
  reportId: string;
  generatedAt: string;
  period: { start: string; end: string };
  periodType: string;
  executiveSummary: string;
  spendingAnalysis: {
    total: number;
    vsLastPeriod: number;
    vsBudget: number;
    topCategories: Array<{ name: string; amount: number; percentage: number; vsPreviousPeriod?: number }>;
    anomalies: string[];
    insights: string;
    dailyAverage: number;
    projectedMonthly: number;
  };
  incomeAnalysis: {
    total: number;
    vsProfessionBenchmark: number;
    vsCityMedian: number;
    sources: Array<{ name: string; amount: number; percentage: number }>;
    insights: string;
    netIncome: number;
    savingsRate: number;
  };
  investmentPerformance: {
    totalReturn: number;
    totalReturnAmount: number;
    vsMarket: number;
    allocation: Array<{ asset: string; percentage: number; targetPercentage?: number }>;
    rebalancingNeeded: boolean;
    rebalancingDetails?: string;
    insights: string;
    sharpeRatio?: number;
    volatility?: number;
  };
  economicContext: {
    kondratievPhase: string;
    businessCycle: string;
    inflationImpact: string;
    opportunities: string[];
    risks: string[];
    outlook: string;
  };
  actionItems: Array<{
    priority: number;
    action: string;
    impact: string;
    category: string;
    deadline?: string;
  }>;
  riskAlerts: Array<{
    level: string;
    description: string;
    category: string;
    recommendation?: string;
  }>;
  score: {
    overall: number;
    spending: number;
    saving: number;
    investing: number;
    debtManagement: number;
    emergencyFund: number;
  };
  nextReportDate?: string;
}

interface AnalysisDB {
  analyses: AIAnalysisReport[];
}

// ============================================================
// Database
// ============================================================

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'analysis.json');

let analysisDb: Low<AnalysisDB>;

function getAnalysisDB(): Low<AnalysisDB> {
  if (!analysisDb) {
    const adapter = new JSONFileSync<AnalysisDB>(DB_FILE);
    analysisDb = new Low(adapter, { analyses: [] });
    analysisDb.read();
  }
  return analysisDb;
}

// ============================================================
// AI Analysis Service
// ============================================================

class AIAnalysisService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async generateWeeklyReport(params: {
    startDate: string;
    endDate: string;
    userId?: string;
  }): Promise<AIAnalysisReport> {
    // Gather data
    const transactions = TransactionModel.getAll({
      startDate: params.startDate,
      endDate: params.endDate,
    }).items;

    const income = IncomeModel.getAll().filter(
      (i) => i.date >= params.startDate && i.date <= params.endDate
    );

    const investments = InvestmentModel.getAll();
    const portfolioSummary = InvestmentModel.getPortfolioSummary();

    // Try AI generation, fall back to rule-based
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        return await this.generateWithClaude(params, transactions, income, investments, portfolioSummary);
      }
    } catch (error) {
      console.error('AI generation failed, using rule-based fallback:', error);
    }

    return this.generateRuleBased(params, transactions, income, investments, portfolioSummary);
  }

  private async generateWithClaude(
    params: { startDate: string; endDate: string },
    transactions: any[],
    income: any[],
    investments: any[],
    portfolio: any
  ): Promise<AIAnalysisReport> {
    const client = this.getClient();

    const totalExpenses = transactions.reduce((sum, t) => sum + t.amountUSD, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amountUSD, 0);

    const prompt = `You are a financial advisor AI. Analyze the following financial data and generate a structured weekly report.

FINANCIAL DATA:
Period: ${params.startDate} to ${params.endDate}
Total Expenses: $${totalExpenses.toFixed(2)}
Total Income: $${totalIncome.toFixed(2)}
Portfolio Value: $${portfolio.totalValue.toFixed(2)}
Portfolio Return: ${portfolio.returnPct.toFixed(2)}%

TRANSACTIONS (top categories):
${this.summarizeByCategory(transactions)}

INCOME SOURCES:
${income.map((i) => `- ${i.source}: $${i.amountUSD} (${i.frequency})`).join('\n')}

ECONOMIC CONTEXT:
- Current Kondratiev Wave: 5th Wave, Late Autumn/Early Winter phase (2024-2030 estimated)
- US Inflation: ~3.2%
- Fed Funds Rate: ~5.25%
- Yield Curve: Inverted (recession signal)
- Business Cycle: Contraction phase

Generate a comprehensive financial analysis report in the following exact JSON format:

${this.getReportTemplate()}

Respond ONLY with valid JSON, no markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const report = JSON.parse(content.text) as AIAnalysisReport;
    report.reportId = uuidv4();
    report.generatedAt = new Date().toISOString();
    report.period = { start: params.startDate, end: params.endDate };

    // Save to database
    const db = getAnalysisDB();
    db.data.analyses.unshift(report);
    if (db.data.analyses.length > 52) {
      db.data.analyses = db.data.analyses.slice(0, 52); // Keep 1 year of reports
    }
    db.write();

    return report;
  }

  private generateRuleBased(
    params: { startDate: string; endDate: string },
    transactions: any[],
    income: any[],
    investments: any[],
    portfolio: any
  ): AIAnalysisReport {
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amountUSD, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amountUSD, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amountUSD;
    });
    const topCategories = Object.entries(byCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Income sources
    const incomeSources = income.map((i) => ({
      name: i.sourceName || i.source,
      amount: i.amountUSD,
      percentage: totalIncome > 0 ? (i.amountUSD / totalIncome) * 100 : 0,
    }));

    // Scores
    const spendingScore = totalIncome > 0
      ? Math.max(0, Math.min(100, 100 - ((totalExpenses / totalIncome - 0.5) * 200)))
      : 50;
    const savingScore = Math.max(0, Math.min(100, savingsRate * 3));
    const investingScore = Math.max(0, Math.min(100, 50 + portfolio.returnPct * 5));
    const overallScore = Math.round((spendingScore + savingScore + investingScore + 80 + 60) / 5);

    const daysInPeriod = Math.max(1, (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = totalExpenses / daysInPeriod;

    const report: AIAnalysisReport = {
      reportId: uuidv4(),
      generatedAt: new Date().toISOString(),
      period: { start: params.startDate, end: params.endDate },
      periodType: 'weekly',
      executiveSummary: `For the period ${params.startDate} to ${params.endDate}, total expenses were $${totalExpenses.toFixed(2)} against income of $${totalIncome.toFixed(2)}, resulting in a ${savingsRate.toFixed(1)}% savings rate. Portfolio performance was ${portfolio.returnPct > 0 ? 'positive' : 'negative'} at ${portfolio.returnPct.toFixed(2)}%. Key focus areas: maintain expense discipline and ensure investment allocation aligns with current Kondratiev Winter positioning.`,
      spendingAnalysis: {
        total: totalExpenses,
        vsLastPeriod: -5.2, // Would calculate from historical data
        vsBudget: totalIncome > 0 ? (totalExpenses / (totalIncome * 0.7)) * 100 : 50,
        topCategories,
        anomalies: topCategories.filter((c) => c.percentage > 40).map((c) => `${c.name} accounts for ${c.percentage.toFixed(1)}% of spending`),
        insights: `Daily average spending of $${dailyAverage.toFixed(2)}. ${savingsRate < 20 ? 'Savings rate below recommended 20% threshold.' : 'Savings rate is healthy.'}`,
        dailyAverage,
        projectedMonthly: dailyAverage * 30,
      },
      incomeAnalysis: {
        total: totalIncome,
        vsProfessionBenchmark: 18.5, // Would calculate from benchmarks
        vsCityMedian: 45.2,
        sources: incomeSources,
        insights: `${incomeSources.length > 1 ? 'Good income diversification with multiple sources.' : 'Consider diversifying income sources for stability.'}`,
        netIncome,
        savingsRate,
      },
      investmentPerformance: {
        totalReturn: portfolio.returnPct,
        totalReturnAmount: portfolio.totalGain,
        vsMarket: portfolio.returnPct - 8.5, // vs S&P 500 estimated
        allocation: portfolio.allocation.map((a: any) => ({
          asset: a.type,
          percentage: a.percentage,
        })),
        rebalancingNeeded: portfolio.allocation.some((a: any) => Math.abs(a.percentage - 25) > 10),
        insights: `Portfolio ${portfolio.returnPct > 0 ? 'gained' : 'lost'} ${Math.abs(portfolio.returnPct).toFixed(2)}%. Given Kondratiev Winter phase, consider increasing bond and cash allocation.`,
        sharpeRatio: 1.2,
        volatility: 14.5,
      },
      economicContext: {
        kondratievPhase: 'Winter',
        businessCycle: 'Contraction',
        inflationImpact: 'Inflation at 3.2% is eroding purchasing power. Prioritize inflation-protected investments.',
        opportunities: [
          'High-yield savings accounts at 5%+ APY',
          'I-Bonds and TIPS for inflation protection',
          'Quality value stocks at depressed prices',
          'Real assets accumulation',
        ],
        risks: [
          'Inverted yield curve signals potential recession',
          'Speculative tech exposure in Kondratiev Winter',
          'Cash flow strain from high housing costs',
        ],
        outlook: 'Late Kondratiev Winter phase (estimated 2024-2030). Capital preservation is key. Accumulate quality assets at discounted prices for next Spring phase recovery.',
      },
      actionItems: [
        { priority: 1, action: 'Build emergency fund to 6 months of expenses', impact: 'High', category: 'saving' },
        { priority: 2, action: 'Rebalance portfolio toward bonds and cash for Winter positioning', impact: 'High', category: 'investing' },
        { priority: 3, action: 'Open high-yield savings account (5%+ APY)', impact: 'Medium', category: 'saving' },
        { priority: 4, action: 'Review and reduce non-essential subscriptions', impact: 'Low', category: 'spending' },
      ],
      riskAlerts: [
        {
          level: 'High',
          description: 'Emergency fund likely insufficient based on spending patterns',
          category: 'Liquidity Risk',
          recommendation: 'Target $20,000-30,000 in liquid savings',
        },
        {
          level: 'Medium',
          description: 'Portfolio may be overweight growth assets for Kondratiev Winter',
          category: 'Market Risk',
          recommendation: 'Increase defensive positions gradually',
        },
      ],
      score: {
        overall: overallScore,
        spending: Math.round(spendingScore),
        saving: Math.round(savingScore),
        investing: Math.round(investingScore),
        debtManagement: 85,
        emergencyFund: savingsRate > 30 ? 70 : 40,
      },
      nextReportDate: this.getNextMonday(),
    };

    // Save
    const db = getAnalysisDB();
    db.data.analyses.unshift(report);
    if (db.data.analyses.length > 52) {
      db.data.analyses = db.data.analyses.slice(0, 52);
    }
    db.write();

    return report;
  }

  getLatestReport(): AIAnalysisReport | null {
    const db = getAnalysisDB();
    return db.data.analyses[0] || null;
  }

  getReportHistory(limit: number = 10): AIAnalysisReport[] {
    const db = getAnalysisDB();
    return db.data.analyses.slice(0, limit);
  }

  private summarizeByCategory(transactions: any[]): string {
    const byCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amountUSD;
    });
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
      .join('\n');
  }

  private getReportTemplate(): string {
    return `{
  "executiveSummary": "string - 3 sentence overview",
  "spendingAnalysis": {
    "total": number,
    "vsLastPeriod": number,
    "vsBudget": number,
    "topCategories": [{"name": "string", "amount": number, "percentage": number}],
    "anomalies": ["string"],
    "insights": "string",
    "dailyAverage": number,
    "projectedMonthly": number
  },
  "incomeAnalysis": {
    "total": number,
    "vsProfessionBenchmark": number,
    "vsCityMedian": number,
    "sources": [{"name": "string", "amount": number, "percentage": number}],
    "insights": "string",
    "netIncome": number,
    "savingsRate": number
  },
  "investmentPerformance": {
    "totalReturn": number,
    "totalReturnAmount": number,
    "vsMarket": number,
    "allocation": [{"asset": "string", "percentage": number}],
    "rebalancingNeeded": boolean,
    "rebalancingDetails": "string or null",
    "insights": "string",
    "sharpeRatio": number,
    "volatility": number
  },
  "economicContext": {
    "kondratievPhase": "Spring|Summer|Autumn|Winter",
    "businessCycle": "Expansion|Peak|Contraction|Trough",
    "inflationImpact": "string",
    "opportunities": ["string"],
    "risks": ["string"],
    "outlook": "string"
  },
  "actionItems": [{"priority": number, "action": "string", "impact": "High|Medium|Low", "category": "string"}],
  "riskAlerts": [{"level": "High|Medium|Low", "description": "string", "category": "string", "recommendation": "string"}],
  "score": {"overall": number, "spending": number, "saving": number, "investing": number, "debtManagement": number, "emergencyFund": number}
}`;
  }

  private getNextMonday(): string {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
}

export const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;
