import { Router, Request, Response } from 'express';
import { economicDataService } from '../services/economic-data.service';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// GET /api/economic/country/:countryCode
router.get('/country/:countryCode', asyncHandler(async (req: Request, res: Response) => {
  const data = await economicDataService.getCountryData(req.params.countryCode);
  res.json({ success: true, data });
}));

// GET /api/economic/cost-of-living
router.get('/cost-of-living', asyncHandler(async (req: Request, res: Response) => {
  const { city, country = 'US' } = req.query;
  const countryData = await economicDataService.getCountryData(country as string);
  const cityIndex = economicDataService.getCostOfLivingIndex(city as string || '');

  res.json({
    success: true,
    data: {
      ...countryData.costOfLiving,
      cityIndex,
      city: city || 'National Average',
      country,
    },
  });
}));

// GET /api/economic/profession-benchmark
router.get('/profession-benchmark', asyncHandler(async (req: Request, res: Response) => {
  const { profession, level, country = 'US' } = req.query;

  if (!profession || !level) {
    res.status(400).json({ success: false, error: 'profession and level are required' });
    return;
  }

  const benchmark = economicDataService.getProfessionBenchmark(
    profession as string,
    level as string,
    country as string
  );

  res.json({ success: true, data: benchmark });
}));

// GET /api/economic/yield-curve
router.get('/yield-curve', asyncHandler(async (req: Request, res: Response) => {
  const data = economicDataService.getYieldCurve();
  res.json({ success: true, data });
}));

// GET /api/economic/kondratiev
router.get('/kondratiev', asyncHandler(async (req: Request, res: Response) => {
  const position = economicDataService.getKondratievPosition();
  res.json({ success: true, data: position });
}));

// GET /api/economic/inflation-impact
router.get('/inflation-impact', asyncHandler(async (req: Request, res: Response) => {
  const { spending, inflationRate = 3.2, months = 12 } = req.query;

  if (!spending) {
    res.status(400).json({ success: false, error: 'spending parameter required' });
    return;
  }

  const impact = economicDataService.calculateInflationImpact(
    parseFloat(spending as string),
    parseFloat(inflationRate as string),
    parseInt(months as string)
  );

  res.json({ success: true, data: impact });
}));

export default router;
