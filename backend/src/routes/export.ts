import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exportService } from '../services/export.service';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/export/excel
router.post('/excel', asyncHandler(async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    includeTransactions = true,
    includeIncome = true,
    includeInvestments = true,
    includeAnalysis = true,
  } = req.body;

  if (!startDate || !endDate) {
    res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    return;
  }

  const filePath = await exportService.generateExcel({
    startDate,
    endDate,
    includeTransactions,
    includeIncome,
    includeInvestments,
    includeAnalysis,
  });

  const fileName = path.basename(filePath);

  // Send file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    // Clean up file after sending
    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch {}
    }, 5000);
  });
}));

// POST /api/export/csv
router.post('/csv', asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, dataType = 'transactions' } = req.body;

  if (!startDate || !endDate) {
    res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    return;
  }

  const validTypes = ['transactions', 'income', 'investments'];
  if (!validTypes.includes(dataType)) {
    res.status(400).json({ success: false, error: `dataType must be one of: ${validTypes.join(', ')}` });
    return;
  }

  const filePath = await exportService.generateCSV({
    startDate,
    endDate,
    dataType: dataType as 'transactions' | 'income' | 'investments',
  });

  const fileName = path.basename(filePath);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch {}
    }, 5000);
  });
}));

// GET /api/export/preview
router.get('/preview', asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    return;
  }

  // Return summary of what would be exported
  const { TransactionModel } = await import('../models/transaction.model');
  const { IncomeModel } = await import('../models/income.model');
  const { InvestmentModel } = await import('../models/investment.model');

  const transactions = TransactionModel.getAll({
    startDate: startDate as string,
    endDate: endDate as string,
    limit: 10000,
  });

  const income = IncomeModel.getAll().filter(
    (i) => i.date >= (startDate as string) && i.date <= (endDate as string)
  );

  const investments = InvestmentModel.getAll();

  res.json({
    success: true,
    data: {
      transactionCount: transactions.total,
      transactionTotal: transactions.items.reduce((sum, t) => sum + t.amountUSD, 0),
      incomeCount: income.length,
      incomeTotal: income.reduce((sum, i) => sum + i.amountUSD, 0),
      investmentCount: investments.length,
      investmentValue: investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0),
      dateRange: { start: startDate, end: endDate },
    },
  });
}));

export default router;
