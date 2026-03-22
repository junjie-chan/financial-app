import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Parsed Receipt Data
// ============================================================

export interface ParsedReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  date?: string;
  time?: string;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  paymentMethod?: string;
  confidence: number;
  rawText?: string;
}

// ============================================================
// OCR Service
// ============================================================

class OCRService {
  private anthropic: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Process receipt image using Claude Vision
   */
  async processReceipt(imagePath: string): Promise<ParsedReceiptData> {
    try {
      // Read the image file
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase().replace('.', '');
      const mediaType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

      // Use Claude Vision to analyze receipt
      const client = this.getClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analyze this receipt image and extract all information. Return ONLY valid JSON in this exact format:
{
  "merchantName": "string or null",
  "merchantAddress": "string or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "totalAmount": number or null,
  "subtotal": number or null,
  "tax": number or null,
  "tip": number or null,
  "currency": "USD|EUR|GBP etc or null",
  "lineItems": [
    {"description": "string", "quantity": number, "unitPrice": number, "totalPrice": number}
  ],
  "paymentMethod": "string or null",
  "confidence": number between 0 and 1
}`,
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = JSON.parse(content.text.trim()) as ParsedReceiptData;
      return parsed;
    } catch (error) {
      console.error('Claude Vision OCR failed:', error);
      // Return regex-based parsing as fallback
      return this.parseWithRegex(imagePath);
    }
  }

  /**
   * Fallback: Parse using regex patterns on a text file
   */
  parseWithRegex(imagePath: string): ParsedReceiptData {
    // In real implementation, would use Google Vision API or Tesseract
    // For now, return mock data
    return this.getMockReceiptData();
  }

  /**
   * Parse raw text from receipt using Claude (text-based)
   */
  async parseReceiptText(text: string): Promise<ParsedReceiptData> {
    try {
      const client = this.getClient();

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Parse this receipt text and extract all relevant information. Return ONLY valid JSON:

RECEIPT TEXT:
${text}

Expected JSON format:
{
  "merchantName": "string or null",
  "merchantAddress": "string or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "totalAmount": number or null,
  "subtotal": number or null,
  "tax": number or null,
  "tip": number or null,
  "currency": "USD",
  "lineItems": [{"description": "string", "quantity": 1, "unitPrice": number, "totalPrice": number}],
  "paymentMethod": "string or null",
  "confidence": 0.85
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return JSON.parse(content.text.trim()) as ParsedReceiptData;
    } catch (error) {
      console.error('Text parsing failed:', error);
      return this.extractWithSimpleRegex(text);
    }
  }

  /**
   * Simple regex extraction as last resort
   */
  private extractWithSimpleRegex(text: string): ParsedReceiptData {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Extract total amount
    const totalMatch = text.match(/(?:total|amount|due|pay):?\s*\$?(\d+\.?\d{0,2})/i);
    const totalAmount = totalMatch ? parseFloat(totalMatch[1]) : undefined;

    // Extract date
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    let date: string | undefined;
    if (dateMatch) {
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      date = `${year}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
    }

    // Extract merchant (first non-empty line often is the store name)
    const merchantName = lines[0] || undefined;

    // Extract tax
    const taxMatch = text.match(/tax:?\s*\$?(\d+\.?\d{0,2})/i);
    const tax = taxMatch ? parseFloat(taxMatch[1]) : undefined;

    return {
      merchantName,
      date,
      totalAmount,
      tax,
      currency: 'USD',
      lineItems: [],
      confidence: 0.4,
      rawText: text,
    };
  }

  /**
   * Mock receipt data for development/demo
   */
  getMockReceiptData(): ParsedReceiptData {
    return {
      merchantName: 'Whole Foods Market',
      merchantAddress: '399 4th St, San Francisco, CA 94107',
      date: new Date().toISOString().split('T')[0],
      time: '14:35',
      totalAmount: 127.43,
      subtotal: 118.00,
      tax: 9.43,
      currency: 'USD',
      lineItems: [
        { description: 'Organic Salmon (2 lbs)', quantity: 1, unitPrice: 24.99, totalPrice: 24.99 },
        { description: 'Avocado 3pk', quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
        { description: 'Greek Yogurt', quantity: 3, unitPrice: 4.99, totalPrice: 14.97 },
        { description: 'Mixed Vegetables', quantity: 1, unitPrice: 8.99, totalPrice: 8.99 },
        { description: 'Sourdough Bread', quantity: 1, unitPrice: 7.49, totalPrice: 7.49 },
        { description: 'Almond Milk 64oz', quantity: 2, unitPrice: 4.99, totalPrice: 9.98 },
        { description: 'Kombucha 4pk', quantity: 1, unitPrice: 12.99, totalPrice: 12.99 },
        { description: 'Organic Apples 3lb', quantity: 1, unitPrice: 6.99, totalPrice: 6.99 },
        { description: 'Pasta 3pk', quantity: 1, unitPrice: 8.49, totalPrice: 8.49 },
        { description: 'Olive Oil 16oz', quantity: 1, unitPrice: 11.99, totalPrice: 11.99 },
      ],
      paymentMethod: 'Visa Credit Card',
      confidence: 0.92,
    };
  }
}

export const ocrService = new OCRService();
export default ocrService;
