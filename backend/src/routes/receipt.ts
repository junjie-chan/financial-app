import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ocrService } from '../services/ocr.service';
import { TransactionModel } from '../models/transaction.model';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Configure multer for image uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// POST /api/receipt/scan
router.post('/scan', upload.single('receipt'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    // Return mock data for development (when no image is uploaded)
    const mockData = ocrService.getMockReceiptData();
    res.json({ success: true, data: mockData });
    return;
  }

  try {
    const parsedData = await ocrService.processReceipt(req.file.path);
    res.json({
      success: true,
      data: parsedData,
      imageUrl: `/uploads/${req.file.filename}`,
    });
  } finally {
    // Clean up uploaded file after processing
    if (req.file && fs.existsSync(req.file.path)) {
      setTimeout(() => {
        try { fs.unlinkSync(req.file!.path); } catch {}
      }, 5000);
    }
  }
}));

// POST /api/receipt/parse-text
router.post('/parse-text', asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ success: false, error: 'text field required' });
    return;
  }

  const parsedData = await ocrService.parseReceiptText(text);
  res.json({ success: true, data: parsedData });
}));

// POST /api/receipt/confirm
router.post('/confirm', asyncHandler(async (req: Request, res: Response) => {
  const { merchantName, date, totalAmount, currency, category, notes, lineItems, receiptImageUrl, isOnline } = req.body;

  if (!totalAmount || !category) {
    res.status(400).json({ success: false, error: 'totalAmount and category are required' });
    return;
  }

  const transaction = TransactionModel.create({
    amount: totalAmount,
    amountUSD: totalAmount, // In production, would convert based on currency
    category: category || 'Other',
    merchant: merchantName || 'Unknown',
    date: date || new Date().toISOString().split('T')[0],
    isOnline: isOnline || false,
    currency: currency || 'USD',
    notes: notes || '',
    tags: ['receipt-scanned'],
    receiptImageUrl,
    lineItems: lineItems || [],
  });

  res.status(201).json({ success: true, data: transaction });
}));

export default router;
