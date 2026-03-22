import { Router, Request, Response } from 'express';
import { IncomeModel } from '../models/income.model';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const income = IncomeModel.getAll();
  res.json({ success: true, data: income });
}));

router.get('/monthly-total', asyncHandler(async (req: Request, res: Response) => {
  const total = IncomeModel.getMonthlyTotal();
  res.json({ success: true, data: { monthlyTotal: total } });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const income = IncomeModel.getById(req.params.id);
  if (!income) {
    res.status(404).json({ success: false, error: 'Income not found' });
    return;
  }
  res.json({ success: true, data: income });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.amount || !data.source) {
    res.status(400).json({ success: false, error: 'amount and source are required' });
    return;
  }

  const income = IncomeModel.create({
    ...data,
    amountUSD: data.amountUSD || data.amount,
    date: data.date || new Date().toISOString().split('T')[0],
    frequency: data.frequency || 'monthly',
    currency: data.currency || 'USD',
    isRecurring: data.isRecurring !== undefined ? data.isRecurring : true,
  });

  res.status(201).json({ success: true, data: income });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const income = IncomeModel.update(req.params.id, req.body);
  if (!income) {
    res.status(404).json({ success: false, error: 'Income not found' });
    return;
  }
  res.json({ success: true, data: income });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = IncomeModel.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Income not found' });
    return;
  }
  res.json({ success: true, message: 'Income deleted' });
}));

export default router;
