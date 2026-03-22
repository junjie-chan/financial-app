import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Income, Investment, AIAnalysis } from '../types';

// ============================================================
// Export Service - CSV generation and file sharing
// ============================================================

class ExportService {
  /**
   * Export transactions to CSV
   */
  async exportTransactionsCSV(
    transactions: Transaction[],
    filename?: string
  ): Promise<void> {
    const headers = [
      'Date',
      'Merchant',
      'Category',
      'Subcategory',
      'Amount',
      'Currency',
      'Online/Offline',
      'Location',
      'Notes',
      'Tags',
    ];

    const rows = transactions.map((t) => [
      t.date,
      `"${t.merchant || ''}"`,
      t.category,
      t.subcategory || '',
      t.amount.toFixed(2),
      t.currency,
      t.isOnline ? 'Online' : 'Offline',
      `"${t.location || ''}"`,
      `"${t.notes || ''}"`,
      `"${(t.tags || []).join(', ')}"`,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    await this.saveAndShareFile(
      csv,
      filename || `transactions_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  /**
   * Export income to CSV
   */
  async exportIncomeCSV(income: Income[], filename?: string): Promise<void> {
    const headers = ['Date', 'Source', 'Description', 'Amount', 'Currency', 'Frequency', 'Recurring'];

    const rows = income.map((i) => [
      i.date,
      i.source,
      `"${i.sourceName || ''}"`,
      i.amount.toFixed(2),
      i.currency,
      i.frequency,
      i.isRecurring ? 'Yes' : 'No',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    await this.saveAndShareFile(
      csv,
      filename || `income_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  /**
   * Export investments to CSV
   */
  async exportInvestmentsCSV(
    investments: Investment[],
    filename?: string
  ): Promise<void> {
    const headers = [
      'Name',
      'Symbol',
      'Type',
      'Platform',
      'Quantity',
      'Purchase Price',
      'Current Price',
      'Total Cost',
      'Current Value',
      'Gain/Loss',
      'Return %',
      'Purchase Date',
      'Currency',
    ];

    const rows = investments.map((inv) => {
      const totalCost = inv.purchasePrice * inv.quantity;
      const currentValue = inv.currentPrice * inv.quantity;
      const gainLoss = currentValue - totalCost;
      const returnPct = totalCost > 0 ? ((gainLoss / totalCost) * 100).toFixed(2) : '0';

      return [
        `"${inv.name}"`,
        inv.symbol || '',
        inv.type,
        inv.platform || '',
        inv.quantity,
        inv.purchasePrice.toFixed(2),
        inv.currentPrice.toFixed(2),
        totalCost.toFixed(2),
        currentValue.toFixed(2),
        gainLoss.toFixed(2),
        returnPct,
        inv.date,
        inv.currency,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    await this.saveAndShareFile(
      csv,
      filename || `investments_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  /**
   * Export full financial report to text
   */
  async exportAnalysisReport(analysis: AIAnalysis, filename?: string): Promise<void> {
    const report = this.formatAnalysisReport(analysis);

    await this.saveAndShareFile(
      report,
      filename || `financial_report_${analysis.period.start}.txt`,
      'text/plain'
    );
  }

  /**
   * Combined export - all data
   */
  async exportAllData(
    transactions: Transaction[],
    income: Income[],
    investments: Investment[],
    analysis: AIAnalysis | null,
    dateRange: { start: string; end: string }
  ): Promise<void> {
    const filteredTransactions = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end
    );
    const filteredIncome = income.filter(
      (i) => i.date >= dateRange.start && i.date <= dateRange.end
    );

    // Build comprehensive CSV
    let content = `FinanceAI Export - ${dateRange.start} to ${dateRange.end}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Summary section
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.amountUSD, 0);
    const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amountUSD, 0);
    const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);

    content += `=== FINANCIAL SUMMARY ===\n`;
    content += `Total Income: $${totalIncome.toFixed(2)}\n`;
    content += `Total Expenses: $${totalExpenses.toFixed(2)}\n`;
    content += `Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}\n`;
    content += `Investment Portfolio Value: $${totalInvestmentValue.toFixed(2)}\n\n`;

    if (analysis) {
      content += this.formatAnalysisReport(analysis);
    }

    await this.saveAndShareFile(
      content,
      `financeai_export_${dateRange.start}_${dateRange.end}.txt`,
      'text/plain'
    );
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private formatAnalysisReport(analysis: AIAnalysis): string {
    let report = '';
    report += `=== FINANCIAL INTELLIGENCE REPORT ===\n`;
    report += `Period: ${analysis.period.start} to ${analysis.period.end}\n`;
    report += `Generated: ${new Date(analysis.generatedAt).toLocaleString()}\n\n`;

    report += `EXECUTIVE SUMMARY\n${analysis.executiveSummary}\n\n`;

    report += `FINANCIAL SCORE: ${analysis.score.overall}/100\n`;
    report += `  Spending: ${analysis.score.spending}/100\n`;
    report += `  Saving: ${analysis.score.saving}/100\n`;
    report += `  Investing: ${analysis.score.investing}/100\n\n`;

    report += `SPENDING ANALYSIS\n`;
    report += `  Total: $${analysis.spendingAnalysis.total.toFixed(2)}\n`;
    report += `  vs Last Period: ${analysis.spendingAnalysis.vsLastPeriod > 0 ? '+' : ''}${analysis.spendingAnalysis.vsLastPeriod.toFixed(1)}%\n`;
    report += `  vs Budget: ${analysis.spendingAnalysis.vsBudget.toFixed(1)}%\n`;
    report += `  Top Categories:\n`;
    analysis.spendingAnalysis.topCategories.forEach((cat) => {
      report += `    - ${cat.name}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)\n`;
    });
    report += `  Insights: ${analysis.spendingAnalysis.insights}\n\n`;

    report += `INCOME ANALYSIS\n`;
    report += `  Total: $${analysis.incomeAnalysis.total.toFixed(2)}\n`;
    report += `  vs Profession Benchmark: ${analysis.incomeAnalysis.vsProfessionBenchmark > 0 ? '+' : ''}${analysis.incomeAnalysis.vsProfessionBenchmark.toFixed(1)}%\n`;
    report += `  vs City Median: ${analysis.incomeAnalysis.vsCityMedian > 0 ? '+' : ''}${analysis.incomeAnalysis.vsCityMedian.toFixed(1)}%\n`;
    report += `  Savings Rate: ${analysis.incomeAnalysis.savingsRate.toFixed(1)}%\n\n`;

    report += `INVESTMENT PERFORMANCE\n`;
    report += `  Total Return: ${analysis.investmentPerformance.totalReturn > 0 ? '+' : ''}${analysis.investmentPerformance.totalReturn.toFixed(2)}%\n`;
    report += `  vs Market: ${analysis.investmentPerformance.vsMarket > 0 ? '+' : ''}${analysis.investmentPerformance.vsMarket.toFixed(2)}%\n`;
    report += `  Rebalancing Needed: ${analysis.investmentPerformance.rebalancingNeeded ? 'Yes' : 'No'}\n\n`;

    report += `ECONOMIC CONTEXT\n`;
    report += `  Kondratiev Phase: ${analysis.economicContext.kondratievPhase}\n`;
    report += `  Business Cycle: ${analysis.economicContext.businessCycle}\n`;
    report += `  Inflation Impact: ${analysis.economicContext.inflationImpact}\n\n`;

    report += `ACTION ITEMS\n`;
    analysis.actionItems.forEach((item) => {
      report += `  ${item.priority}. [${item.impact}] ${item.action}\n`;
    });
    report += '\n';

    report += `RISK ALERTS\n`;
    analysis.riskAlerts.forEach((alert) => {
      report += `  [${alert.level}] ${alert.description}\n`;
      if (alert.recommendation) {
        report += `    Recommendation: ${alert.recommendation}\n`;
      }
    });

    return report;
  }

  private async saveAndShareFile(
    content: string,
    filename: string,
    mimeType: string
  ): Promise<void> {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Export Financial Data',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  }
}

export const exportService = new ExportService();
export default exportService;
