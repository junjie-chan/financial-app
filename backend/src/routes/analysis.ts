import { Router, Request, Response } from 'express';
import { aiAnalysisService } from '../services/ai-analysis.service';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// GET /api/analysis/latest
router.get('/latest', asyncHandler(async (req: Request, res: Response) => {
  const report = aiAnalysisService.getLatestReport();
  if (!report) {
    res.status(404).json({ success: false, error: 'No analysis reports found' });
    return;
  }
  res.json({ success: true, data: report });
}));

// GET /api/analysis/history
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  const reports = aiAnalysisService.getReportHistory(parseInt(limit as string));
  res.json({ success: true, data: reports });
}));

// POST /api/analysis/generate
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, periodType } = req.body;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const report = await aiAnalysisService.generateWeeklyReport({
    startDate: startDate || weekAgo.toISOString().split('T')[0],
    endDate: endDate || now.toISOString().split('T')[0],
  });

  res.status(201).json({ success: true, data: report });
}));

// GET /api/analysis/economic-context
router.get('/economic-context', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      kondratievPhase: 'Winter',
      kondratievWave: 5,
      estimatedYear: new Date().getFullYear(),
      businessCycle: 'Contraction',
      yieldCurve: 'Inverted',
      debtCycle: 'Deleveraging',
      implication: 'Late Kondratiev Winter phase. Capital preservation is key.',
      indicators: {
        gdpGrowth: 2.8,
        inflation: 3.2,
        unemploymentRate: 3.9,
        fedFundsRate: 5.25,
        sp500PE: 22.5,
        creditSpreads: 1.8,
      },
    },
  });
}));

export default router;
