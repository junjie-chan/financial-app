import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { TransactionModel } from '../models/transaction.model';
import { IncomeModel } from '../models/income.model';
import { InvestmentModel } from '../models/investment.model';
import { aiAnalysisService } from './ai-analysis.service';

// ============================================================
// Export Service
// ============================================================

class ExportService {
  private outputDir: string;

  constructor() {
    this.outputDir = process.env.DATA_DIR
      ? path.join(process.env.DATA_DIR, '..', 'exports')
      : path.join(__dirname, '..', '..', 'exports');

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive Excel export
   */
  async generateExcel(filters: {
    startDate: string;
    endDate: string;
    includeTransactions?: boolean;
    includeIncome?: boolean;
    includeInvestments?: boolean;
    includeAnalysis?: boolean;
  }): Promise<string> {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Transactions
    if (filters.includeTransactions !== false) {
      const transactions = TransactionModel.getAll({
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 10000,
      }).items;

      const txData = [
        ['Date', 'Merchant', 'Category', 'Subcategory', 'Amount USD', 'Currency', 'Amount Local', 'Online', 'Location', 'Notes', 'Tags'],
        ...transactions.map((t) => [
          t.date,
          t.merchant || '',
          t.category,
          t.subcategory || '',
          t.amountUSD,
          t.currency,
          t.amount,
          t.isOnline ? 'Online' : 'In-Store',
          t.location || '',
          t.notes || '',
          (t.tags || []).join(', '),
        ]),
      ];

      const txSheet = XLSX.utils.aoa_to_sheet(txData);
      this.styleSheet(txSheet, txData.length);
      XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');
    }

    // Sheet 2: Income
    if (filters.includeIncome !== false) {
      const income = IncomeModel.getAll().filter(
        (i) => i.date >= filters.startDate && i.date <= filters.endDate
      );

      const incomeData = [
        ['Date', 'Source', 'Description', 'Amount USD', 'Currency', 'Amount Local', 'Frequency', 'Recurring'],
        ...income.map((i) => [
          i.date,
          i.source,
          i.sourceName || '',
          i.amountUSD,
          i.currency,
          i.amount,
          i.frequency,
          i.isRecurring ? 'Yes' : 'No',
        ]),
      ];

      const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
      this.styleSheet(incomeSheet, incomeData.length);
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income');
    }

    // Sheet 3: Investments
    if (filters.includeInvestments !== false) {
      const investments = InvestmentModel.getAll();

      const invData = [
        ['Name', 'Symbol', 'Type', 'Platform', 'Quantity', 'Purchase Price', 'Current Price', 'Total Cost', 'Current Value', 'Gain/Loss', 'Return %', 'Purchase Date', 'Currency'],
        ...investments.map((inv) => {
          const totalCost = inv.purchasePrice * inv.quantity;
          const currentValue = inv.currentPrice * inv.quantity;
          const gainLoss = currentValue - totalCost;
          const returnPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

          return [
            inv.name,
            inv.symbol || '',
            inv.type,
            inv.platform || '',
            inv.quantity,
            inv.purchasePrice,
            inv.currentPrice,
            totalCost,
            currentValue,
            gainLoss,
            parseFloat(returnPct.toFixed(2)),
            inv.date,
            inv.currency,
          ];
        }),
      ];

      const invSheet = XLSX.utils.aoa_to_sheet(invData);
      this.styleSheet(invSheet, invData.length);
      XLSX.utils.book_append_sheet(workbook, invSheet, 'Investments');
    }

    // Sheet 4: Monthly Summary
    const summaryData = this.generateMonthlySummary(filters.startDate, filters.endDate);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Monthly Summary');

    // Sheet 5: AI Analysis
    if (filters.includeAnalysis !== false) {
      const latestReport = aiAnalysisService.getLatestReport();
      if (latestReport) {
        const analysisData = this.formatAnalysisForSheet(latestReport);
        const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
        XLSX.utils.book_append_sheet(workbook, analysisSheet, 'AI Analysis');
      }
    }

    // Write file
    const fileName = `financeai_export_${filters.startDate}_${filters.endDate}_${Date.now()}.xlsx`;
    const filePath = path.join(this.outputDir, fileName);
    XLSX.writeFile(workbook, filePath);

    return filePath;
  }

  /**
   * Generate CSV export for a specific data type
   */
  async generateCSV(params: {
    startDate: string;
    endDate: string;
    dataType: 'transactions' | 'income' | 'investments';
  }): Promise<string> {
    let csvContent = '';
    let fileName = '';

    switch (params.dataType) {
      case 'transactions': {
        const transactions = TransactionModel.getAll({
          startDate: params.startDate,
          endDate: params.endDate,
          limit: 10000,
        }).items;

        csvContent = [
          'Date,Merchant,Category,Amount USD,Currency,Online,Location,Notes',
          ...transactions.map((t) =>
            [
              t.date,
              `"${(t.merchant || '').replace(/"/g, '""')}"`,
              t.category,
              t.amountUSD.toFixed(2),
              t.currency,
              t.isOnline ? 'Online' : 'In-Store',
              `"${(t.location || '').replace(/"/g, '""')}"`,
              `"${(t.notes || '').replace(/"/g, '""')}"`,
            ].join(',')
          ),
        ].join('\n');

        fileName = `transactions_${params.startDate}_${params.endDate}.csv`;
        break;
      }

      case 'income': {
        const income = IncomeModel.getAll().filter(
          (i) => i.date >= params.startDate && i.date <= params.endDate
        );

        csvContent = [
          'Date,Source,Description,Amount,Currency,Frequency,Recurring',
          ...income.map((i) =>
            [
              i.date,
              i.source,
              `"${(i.sourceName || '').replace(/"/g, '""')}"`,
              i.amountUSD.toFixed(2),
              i.currency,
              i.frequency,
              i.isRecurring ? 'Yes' : 'No',
            ].join(',')
          ),
        ].join('\n');

        fileName = `income_${params.startDate}_${params.endDate}.csv`;
        break;
      }

      case 'investments': {
        const investments = InvestmentModel.getAll();

        csvContent = [
          'Name,Symbol,Type,Platform,Quantity,Purchase Price,Current Price,Total Cost,Current Value,Gain/Loss,Return %,Date',
          ...investments.map((inv) => {
            const totalCost = inv.purchasePrice * inv.quantity;
            const currentValue = inv.currentPrice * inv.quantity;
            const gainLoss = currentValue - totalCost;
            const returnPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
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
              returnPct.toFixed(2),
              inv.date,
            ].join(',');
          }),
        ].join('\n');

        fileName = `investments_${params.startDate}_${params.endDate}.csv`;
        break;
      }
    }

    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, csvContent, 'utf8');

    return filePath;
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private generateMonthlySummary(startDate: string, endDate: string): any[][] {
    const data: any[][] = [
      ['Month', 'Total Income', 'Total Expenses', 'Net Savings', 'Savings Rate %'],
    ];

    // Simple: just add current month totals
    const transactions = TransactionModel.getAll({ startDate, endDate, limit: 10000 }).items;
    const income = IncomeModel.getAll().filter((i) => i.date >= startDate && i.date <= endDate);

    const totalIncome = income.reduce((sum, i) => sum + i.amountUSD, 0);
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amountUSD, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    data.push([
      `${startDate} to ${endDate}`,
      totalIncome.toFixed(2),
      totalExpenses.toFixed(2),
      netSavings.toFixed(2),
      savingsRate.toFixed(1),
    ]);

    return data;
  }

  private formatAnalysisForSheet(report: any): any[][] {
    return [
      ['FinanceAI Analysis Report'],
      ['Generated', report.generatedAt],
      ['Period', `${report.period.start} to ${report.period.end}`],
      [],
      ['FINANCIAL SCORES'],
      ['Overall Score', report.score.overall],
      ['Spending Score', report.score.spending],
      ['Saving Score', report.score.saving],
      ['Investing Score', report.score.investing],
      [],
      ['EXECUTIVE SUMMARY'],
      [report.executiveSummary],
      [],
      ['SPENDING ANALYSIS'],
      ['Total Spending', report.spendingAnalysis?.total || 0],
      ['vs Last Period %', report.spendingAnalysis?.vsLastPeriod || 0],
      [],
      ['ECONOMIC CONTEXT'],
      ['Kondratiev Phase', report.economicContext?.kondratievPhase || 'N/A'],
      ['Business Cycle', report.economicContext?.businessCycle || 'N/A'],
      [],
      ['ACTION ITEMS'],
      ...(report.actionItems || []).map((item: any) => [
        `#${item.priority}`,
        item.action,
        item.impact,
      ]),
    ];
  }

  private styleSheet(sheet: XLSX.WorkSheet, rowCount: number): void {
    // Apply column widths
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const cols = [];
    for (let i = 0; i <= range.e.c; i++) {
      cols.push({ wch: 20 });
    }
    sheet['!cols'] = cols;
  }
}

export const exportService = new ExportService();
export default exportService;
