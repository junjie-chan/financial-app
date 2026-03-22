import { Router, Request, Response } from 'express';
import { InvestmentModel } from '../models/investment.model';
import { investmentService } from '../services/investment.service';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const investments = InvestmentModel.getAll();
  res.json({ success: true, data: investments });
}));

router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = InvestmentModel.getPortfolioSummary();
  res.json({ success: true, data: summary });
}));

router.get('/prices', asyncHandler(async (req: Request, res: Response) => {
  const { symbols } = req.query;
  if (!symbols) {
    res.status(400).json({ success: false, error: 'symbols parameter required' });
    return;
  }
  const symbolList = (symbols as string).split(',').map((s) => s.trim());
  const prices = await investmentService.getPrices(symbolList);
  res.json({ success: true, data: prices });
}));

router.get('/recommendations', asyncHandler(async (req: Request, res: Response) => {
  const { phase = 'Winter' } = req.query;
  const recommendations = investmentService.getKondratievRecommendations(phase as string);
  res.json({ success: true, data: recommendations });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const investment = InvestmentModel.getById(req.params.id);
  if (!investment) {
    res.status(404).json({ success: false, error: 'Investment not found' });
    return;
  }
  res.json({ success: true, data: investment });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.quantity || !data.purchasePrice || !data.currentPrice) {
    res.status(400).json({ success: false, error: 'name, quantity, purchasePrice, and currentPrice are required' });
    return;
  }

  const investment = InvestmentModel.create({
    ...data,
    amount: data.currentPrice * data.quantity,
    amountUSD: data.currentPrice * data.quantity,
    date: data.date || new Date().toISOString().split('T')[0],
    currency: data.currency || 'USD',
    type: data.type || 'stocks',
  });

  res.status(201).json({ success: true, data: investment });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const investment = InvestmentModel.update(req.params.id, req.body);
  if (!investment) {
    res.status(404).json({ success: false, error: 'Investment not found' });
    return;
  }
  res.json({ success: true, data: investment });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = InvestmentModel.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Investment not found' });
    return;
  }
  res.json({ success: true, message: 'Investment deleted' });
}));

export default router;
