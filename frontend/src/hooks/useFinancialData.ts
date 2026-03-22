import { useEffect, useCallback } from 'react';
import { useFinancialStore } from '../store';
import { transactionApi, incomeApi, investmentApi } from '../services/api.service';

export function useFinancialData() {
  const {
    transactions,
    income,
    investments,
    settings,
    isLoading,
    error,
    setLoading,
    setError,
    setTransactions,
    setIncome,
    setInvestments,
    getTotalExpenses,
    getTotalIncome,
    getTotalInvestmentValue,
    getNetWorth,
    getSavingsRate,
  } = useFinancialStore();

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [txRes, incomeRes, invRes] = await Promise.allSettled([
        transactionApi.getAll({ limit: 200 }),
        incomeApi.getAll(),
        investmentApi.getAll(),
      ]);

      if (txRes.status === 'fulfilled' && txRes.value.success && txRes.value.data) {
        setTransactions(txRes.value.data.items || []);
      }

      if (incomeRes.status === 'fulfilled' && incomeRes.value.success && incomeRes.value.data) {
        setIncome(Array.isArray(incomeRes.value.data) ? incomeRes.value.data : []);
      }

      if (invRes.status === 'fulfilled' && invRes.value.success && invRes.value.data) {
        setInvestments(Array.isArray(invRes.value.data) ? invRes.value.data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  // Computed metrics
  const monthlyExpenses = getTotalExpenses('month');
  const monthlyIncome = getTotalIncome('month');
  const totalInvestments = getTotalInvestmentValue();
  const netWorth = getNetWorth();
  const savingsRate = getSavingsRate();

  // Category breakdown
  const categoryBreakdown = transactions.reduce<Record<string, number>>(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amountUSD;
      return acc;
    },
    {}
  );

  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Investment performance
  const portfolioMetrics = {
    totalValue: totalInvestments,
    totalCost: investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0),
    gainLoss: 0,
    returnPercent: 0,
  };
  portfolioMetrics.gainLoss = portfolioMetrics.totalValue - portfolioMetrics.totalCost;
  portfolioMetrics.returnPercent =
    portfolioMetrics.totalCost > 0
      ? (portfolioMetrics.gainLoss / portfolioMetrics.totalCost) * 100
      : 0;

  return {
    // Raw data
    transactions,
    income,
    investments,
    settings,

    // Loading state
    isLoading,
    error,

    // Actions
    loadAllData,
    refreshData,

    // Computed metrics
    monthlyExpenses,
    monthlyIncome,
    totalInvestments,
    netWorth,
    savingsRate,
    topCategories,
    recentTransactions,
    portfolioMetrics,
  };
}

export default useFinancialData;
