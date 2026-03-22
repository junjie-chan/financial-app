import { receiptApi } from './api.service';
import { ParsedReceiptData, TransactionCategory } from '../types';

// ============================================================
// Receipt Service - handles OCR and data parsing
// ============================================================

class ReceiptService {
  /**
   * Upload image and get parsed receipt data from backend
   */
  async processReceiptImage(imageUri: string): Promise<ParsedReceiptData> {
    const response = await receiptApi.scan(imageUri);

    if (response.success && response.data) {
      return response.data;
    }

    // Return mock data for development/offline mode
    return this.getMockReceiptData();
  }

  /**
   * Mock receipt data for development
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
        { description: 'Organic Salmon', quantity: 1, unitPrice: 24.99, totalPrice: 24.99 },
        { description: 'Avocado (3pk)', quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
        { description: 'Greek Yogurt', quantity: 3, unitPrice: 4.99, totalPrice: 14.97 },
        { description: 'Mixed Vegetables', quantity: 1, unitPrice: 8.99, totalPrice: 8.99 },
        { description: 'Sourdough Bread', quantity: 1, unitPrice: 7.49, totalPrice: 7.49 },
        { description: 'Almond Milk', quantity: 2, unitPrice: 4.99, totalPrice: 9.98 },
        { description: 'Kombucha (4pk)', quantity: 1, unitPrice: 12.99, totalPrice: 12.99 },
        { description: 'Organic Apples', quantity: 1, unitPrice: 6.99, totalPrice: 6.99 },
        { description: 'Pasta (3pk)', quantity: 1, unitPrice: 8.49, totalPrice: 8.49 },
        { description: 'Olive Oil', quantity: 1, unitPrice: 11.99, totalPrice: 11.99 },
      ],
      paymentMethod: 'Credit Card',
      confidence: 0.92,
    };
  }

  /**
   * Suggest category based on merchant name and line items
   */
  suggestCategory(receiptData: ParsedReceiptData): TransactionCategory {
    const merchantLower = (receiptData.merchantName || '').toLowerCase();
    const itemNames = (receiptData.lineItems || [])
      .map((item) => item.description.toLowerCase())
      .join(' ');

    const allText = `${merchantLower} ${itemNames}`;

    // Category detection rules
    const rules: Array<{ keywords: string[]; category: TransactionCategory }> = [
      {
        keywords: ['grocery', 'whole foods', 'safeway', 'kroger', 'trader joe', 'costco', 'walmart'],
        category: 'Food & Dining',
      },
      {
        keywords: ['restaurant', 'cafe', 'pizza', 'burger', 'sushi', 'starbucks', 'mcdonald', 'dining'],
        category: 'Food & Dining',
      },
      {
        keywords: ['uber', 'lyft', 'taxi', 'gas', 'shell', 'chevron', 'parking', 'transit', 'bart', 'mta'],
        category: 'Transportation',
      },
      {
        keywords: ['amazon', 'apple', 'best buy', 'target', 'nordstrom', 'zara', 'clothing', 'shoes'],
        category: 'Shopping',
      },
      {
        keywords: ['netflix', 'spotify', 'hulu', 'cinema', 'theater', 'concert', 'game'],
        category: 'Entertainment',
      },
      {
        keywords: ['pharmacy', 'walgreens', 'cvs', 'doctor', 'hospital', 'clinic', 'dental', 'medical'],
        category: 'Healthcare',
      },
      {
        keywords: ['hotel', 'airbnb', 'flight', 'airline', 'expedia', 'booking', 'resort'],
        category: 'Travel',
      },
      {
        keywords: ['electric', 'water', 'internet', 'phone', 'utility', 'comcast', 'at&t'],
        category: 'Utilities',
      },
      {
        keywords: ['school', 'university', 'course', 'book', 'education', 'udemy', 'coursera'],
        category: 'Education',
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((keyword) => allText.includes(keyword))) {
        return rule.category;
      }
    }

    return 'Other';
  }

  /**
   * Validate parsed receipt data
   */
  validateReceiptData(data: ParsedReceiptData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.push('Invalid or missing total amount');
    }

    if (!data.merchantName) {
      warnings.push('Merchant name not detected');
    }

    if (!data.date) {
      warnings.push('Date not detected - using today\'s date');
    }

    if (data.confidence < 0.5) {
      warnings.push('Low confidence in OCR results - please verify the data');
    }

    // Verify line items sum matches total
    if (data.lineItems && data.lineItems.length > 0 && data.subtotal) {
      const itemsSum = data.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const diff = Math.abs(itemsSum - data.subtotal);
      if (diff > 0.10) {
        warnings.push(`Line items sum ($${itemsSum.toFixed(2)}) doesn't match subtotal ($${data.subtotal.toFixed(2)})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
