import axios from 'axios';
import { InvestmentModel } from '../models/investment.model';

// ============================================================
// Price data cache (in-memory)
// ============================================================

const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Mock price data for development
const MOCK_PRICES: Record<string, number> = {
  AAPL: 185.50,
  MSFT: 415.20,
  GOOGL: 175.80,
  AMZN: 198.40,
  NVDA: 875.30,
  META: 510.25,
  TSLA: 248.60,
  VTI: 248.35,
  VOO: 497.80,
  QQQ: 460.50,
  SPY: 520.15,
  TLT: 94.20,
  GLD: 215.40,
  BTC: 68000,
  ETH: 3800,
  BNB: 580,
};

// ============================================================
// Investment Service
// ============================================================

class InvestmentService {
  /**
   * Get current prices for symbols
   */
  async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const toFetch: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        prices[symbol] = cached.price;
      } else {
        toFetch.push(symbol);
      }
    }

    if (toFetch.length > 0) {
      // Try Alpha Vantage (free tier)
      if (process.env.ALPHA_VANTAGE_KEY) {
        try {
          const fetched = await this.fetchFromAlphaVantage(toFetch);
          Object.entries(fetched).forEach(([symbol, price]) => {
            prices[symbol] = price;
            priceCache.set(symbol, { price, timestamp: Date.now() });
          });
        } catch (error) {
          console.error('Alpha Vantage API failed:', error);
          this.useMockPrices(toFetch, prices);
        }
      } else {
        // Use mock prices
        this.useMockPrices(toFetch, prices);
      }
    }

    return prices;
  }

  /**
   * Update investment prices in the database
   */
  async updatePortfolioPrices(): Promise<void> {
    const investments = InvestmentModel.getAll();
    const symbols = investments
      .filter((inv) => inv.symbol)
      .map((inv) => inv.symbol!);

    if (symbols.length === 0) return;

    const prices = await this.getPrices(symbols);

    for (const investment of investments) {
      if (investment.symbol && prices[investment.symbol]) {
        InvestmentModel.update(investment.id, {
          currentPrice: prices[investment.symbol],
          amount: prices[investment.symbol] * investment.quantity,
          amountUSD: prices[investment.symbol] * investment.quantity,
        });
      }
    }
  }

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics() {
    const investments = InvestmentModel.getAll();

    const totalValue = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
    const totalCost = investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
    const totalGain = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // By asset type
    const byType: Record<string, { value: number; cost: number; count: number }> = {};
    investments.forEach((inv) => {
      const value = inv.currentPrice * inv.quantity;
      const cost = inv.purchasePrice * inv.quantity;
      if (!byType[inv.type]) {
        byType[inv.type] = { value: 0, cost: 0, count: 0 };
      }
      byType[inv.type].value += value;
      byType[inv.type].cost += cost;
      byType[inv.type].count += 1;
    });

    const allocation = Object.entries(byType).map(([type, data]) => ({
      type,
      value: data.value,
      cost: data.cost,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      return: data.cost > 0 ? ((data.value - data.cost) / data.cost) * 100 : 0,
    }));

    // Rebalancing check (simplified: each asset type should be ~equal weight)
    const targetPercentage = 100 / allocation.length;
    const rebalancingNeeded = allocation.some(
      (a) => Math.abs(a.percentage - targetPercentage) > 15
    );

    return {
      totalValue,
      totalCost,
      totalGain,
      returnPct,
      allocation,
      rebalancingNeeded,
      investmentCount: investments.length,
    };
  }

  /**
   * Get Kondratiev Wave investment recommendations
   */
  getKondratievRecommendations(phase: string): {
    recommended: string[];
    avoid: string[];
    reasoning: string;
  } {
    const recommendations: Record<string, {
      recommended: string[];
      avoid: string[];
      reasoning: string;
    }> = {
      Spring: {
        recommended: [
          'Growth stocks (especially tech)',
          'Commodities (early cycle)',
          'High-yield bonds',
          'Emerging market equities',
          'Real estate',
        ],
        avoid: [
          'Long-term bonds',
          'Defensive cash-heavy positions',
          'Utilities (too early)',
        ],
        reasoning: 'Spring phase: Recovery after Winter purge. New technologies drive growth. Early risk-taking is rewarded.',
      },
      Summer: {
        recommended: [
          'Equities broadly',
          'Commodities (late cycle peak)',
          'Real estate',
          'Inflation-protected bonds',
          'International diversification',
        ],
        avoid: [
          'Speculative growth',
          'Long duration bonds',
          'Overcrowded trades',
        ],
        reasoning: 'Summer phase: Peak growth. Inflation rises. Real assets outperform financial assets late in this phase.',
      },
      Autumn: {
        recommended: [
          'Financial assets (stocks, bonds)',
          'High-yield bonds',
          'Real estate speculation',
          'Start reducing risk gradually',
        ],
        avoid: [
          'Highly leveraged positions',
          'Late-stage speculative assets',
          'Overpriced real estate',
        ],
        reasoning: 'Autumn phase: Financialization and credit expansion. Asset bubbles form. Begin gradual defensive pivot.',
      },
      Winter: {
        recommended: [
          'Cash and short-term T-bills',
          'Gold and precious metals',
          'Government bonds',
          'Defensive dividend stocks',
          'Real assets at depressed prices',
          'Quality businesses at discounts',
        ],
        avoid: [
          'Speculative tech',
          'High-yield (junk) bonds',
          'Leveraged positions',
          'Crypto (high volatility)',
          'Overvalued real estate',
        ],
        reasoning: 'Winter phase: Debt purge, deflation, deleveraging. Capital preservation is paramount. Accumulate quality at discounts for next Spring.',
      },
    };

    return recommendations[phase] || recommendations['Winter'];
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private async fetchFromAlphaVantage(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const apiKey = process.env.ALPHA_VANTAGE_KEY;

    // Alpha Vantage free tier: 5 requests/minute
    for (const symbol of symbols.slice(0, 5)) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const response = await axios.get(url, { timeout: 5000 });
        const quote = response.data?.['Global Quote'];
        if (quote?.['05. price']) {
          prices[symbol] = parseFloat(quote['05. price']);
        }
        await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limiting
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }

    return prices;
  }

  private useMockPrices(symbols: string[], prices: Record<string, number>): void {
    symbols.forEach((symbol) => {
      const mockPrice = MOCK_PRICES[symbol.toUpperCase()];
      if (mockPrice) {
        // Add some random variation (+/- 2%)
        const variation = 1 + (Math.random() - 0.5) * 0.04;
        prices[symbol] = parseFloat((mockPrice * variation).toFixed(2));
        priceCache.set(symbol, { price: prices[symbol], timestamp: Date.now() });
      }
    });
  }
}

export const investmentService = new InvestmentService();
export default investmentService;
