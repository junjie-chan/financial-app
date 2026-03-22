import { Router, Request, Response } from 'express';
import { TransactionModel } from '../models/transaction.model';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// GET /api/transactions
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, category, startDate, endDate, search } = req.query;

  const result = TransactionModel.getAll({
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
    category: category as string,
    startDate: startDate as string,
    endDate: endDate as string,
    search: search as string,
  });

  res.json({ success: true, data: result });
}));

// GET /api/transactions/summary
router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;
  const summary = TransactionModel.getSummary(period as 'week' | 'month' | 'year');
  res.json({ success: true, data: summary });
}));

// GET /api/transactions/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const transaction = TransactionModel.getById(req.params.id);
  if (!transaction) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, data: transaction });
}));

// POST /api/transactions
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.amount || !data.category) {
    res.status(400).json({ success: false, error: 'amount and category are required' });
    return;
  }

  const transaction = TransactionModel.create({
    ...data,
    amountUSD: data.amountUSD || data.amount,
    date: data.date || new Date().toISOString().split('T')[0],
    isOnline: data.isOnline || false,
    currency: data.currency || 'USD',
    tags: data.tags || [],
  });

  res.status(201).json({ success: true, data: transaction });
}));

// PUT /api/transactions/:id
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const transaction = TransactionModel.update(req.params.id, req.body);
  if (!transaction) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, data: transaction });
}));

// DELETE /api/transactions/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = TransactionModel.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, message: 'Transaction deleted' });
}));

export default router;
