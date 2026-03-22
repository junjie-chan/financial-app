import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Transaction,
  Income,
  Investment,
  AIAnalysis,
  EconomicData,
  UserSettings,
  ParsedReceiptData,
  ApiResponse,
} from '../types';

// ============================================================
// Configuration
// ============================================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const TIMEOUT = 30000;

// ============================================================
// Axios Instance
// ============================================================

let authToken: string | null = null;

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config) => {
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          authToken = null;
          // Could trigger logout here
        }
        return Promise.reject({
          status,
          message: data?.error || data?.message || 'An error occurred',
          data: data,
        });
      } else if (error.request) {
        return Promise.reject({
          status: 0,
          message: 'Network error - please check your connection',
        });
      }
      return Promise.reject({ message: error.message });
    }
  );

  return instance;
};

const api = createAxiosInstance();

// ============================================================
// Auth
// ============================================================

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// ============================================================
// Generic Request Helper
// ============================================================

async function request<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Request failed',
    };
  }
}

// ============================================================
// Transaction API
// ============================================================

export const transactionApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) =>
    request<{ items: Transaction[]; total: number }>({
      method: 'GET',
      url: '/transactions',
      params,
    }),

  getById: (id: string) =>
    request<Transaction>({
      method: 'GET',
      url: `/transactions/${id}`,
    }),

  create: (transaction: Omit<Transaction, 'id'>) =>
    request<Transaction>({
      method: 'POST',
      url: '/transactions',
      data: transaction,
    }),

  update: (id: string, updates: Partial<Transaction>) =>
    request<Transaction>({
      method: 'PUT',
      url: `/transactions/${id}`,
      data: updates,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/transactions/${id}`,
    }),

  getSummary: (period: 'week' | 'month' | 'year') =>
    request<{
      total: number;
      byCategory: Array<{ category: string; amount: number; count: number }>;
      trend: Array<{ date: string; amount: number }>;
    }>({
      method: 'GET',
      url: '/transactions/summary',
      params: { period },
    }),
};

// ============================================================
// Income API
// ============================================================

export const incomeApi = {
  getAll: () =>
    request<Income[]>({
      method: 'GET',
      url: '/income',
    }),

  create: (income: Omit<Income, 'id'>) =>
    request<Income>({
      method: 'POST',
      url: '/income',
      data: income,
    }),

  update: (id: string, updates: Partial<Income>) =>
    request<Income>({
      method: 'PUT',
      url: `/income/${id}`,
      data: updates,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/income/${id}`,
    }),
};

// ============================================================
// Investment API
// ============================================================

export const investmentApi = {
  getAll: () =>
    request<Investment[]>({
      method: 'GET',
      url: '/investments',
    }),

  create: (investment: Omit<Investment, 'id'>) =>
    request<Investment>({
      method: 'POST',
      url: '/investments',
      data: investment,
    }),

  update: (id: string, updates: Partial<Investment>) =>
    request<Investment>({
      method: 'PUT',
      url: `/investments/${id}`,
      data: updates,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/investments/${id}`,
    }),

  getPrices: (symbols: string[]) =>
    request<Record<string, number>>({
      method: 'GET',
      url: '/investments/prices',
      params: { symbols: symbols.join(',') },
    }),
};

// ============================================================
// Receipt / OCR API
// ============================================================

export const receiptApi = {
  scan: async (imageUri: string): Promise<ApiResponse<ParsedReceiptData>> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('receipt', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post<ApiResponse<ParsedReceiptData>>(
        '/receipt/scan',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'OCR failed',
      };
    }
  },

  confirm: (receiptData: ParsedReceiptData & { category: string; notes?: string }) =>
    request<Transaction>({
      method: 'POST',
      url: '/receipt/confirm',
      data: receiptData,
    }),
};

// ============================================================
// Analysis API
// ============================================================

export const analysisApi = {
  getLatest: () =>
    request<AIAnalysis>({
      method: 'GET',
      url: '/analysis/latest',
    }),

  getHistory: (limit?: number) =>
    request<AIAnalysis[]>({
      method: 'GET',
      url: '/analysis/history',
      params: { limit },
    }),

  generateReport: (params?: {
    startDate?: string;
    endDate?: string;
    periodType?: 'weekly' | 'monthly' | 'quarterly';
  }) =>
    request<AIAnalysis>({
      method: 'POST',
      url: '/analysis/generate',
      data: params,
      timeout: 120000, // 2 minutes for AI generation
    } as AxiosRequestConfig),

  getEconomicContext: () =>
    request<{
      kondratievPhase: string;
      businessCycle: string;
      indicators: Record<string, number>;
    }>({
      method: 'GET',
      url: '/analysis/economic-context',
    }),
};

// ============================================================
// Economic Data API
// ============================================================

export const economicApi = {
  getCountryData: (countryCode: string) =>
    request<EconomicData>({
      method: 'GET',
      url: `/economic/country/${countryCode}`,
    }),

  getCostOfLiving: (city: string, country: string) =>
    request<EconomicData['costOfLiving']>({
      method: 'GET',
      url: '/economic/cost-of-living',
      params: { city, country },
    }),

  getProfessionBenchmark: (profession: string, level: string, country: string) =>
    request<{
      medianMonthly: number;
      p25: number;
      p75: number;
      p90: number;
    }>({
      method: 'GET',
      url: '/economic/profession-benchmark',
      params: { profession, level, country },
    }),

  getYieldCurve: () =>
    request<Array<{ maturity: string; yield: number }>>({
      method: 'GET',
      url: '/economic/yield-curve',
    }),
};

// ============================================================
// Settings API
// ============================================================

export const settingsApi = {
  get: () =>
    request<UserSettings>({
      method: 'GET',
      url: '/settings',
    }),

  update: (settings: Partial<UserSettings>) =>
    request<UserSettings>({
      method: 'PUT',
      url: '/settings',
      data: settings,
    }),
};

// ============================================================
// Export API
// ============================================================

export const exportApi = {
  generateExcel: (params: {
    startDate: string;
    endDate: string;
    includeTransactions: boolean;
    includeIncome: boolean;
    includeInvestments: boolean;
    includeAnalysis: boolean;
  }) =>
    request<{ downloadUrl: string; fileName: string }>({
      method: 'POST',
      url: '/export/excel',
      data: params,
    }),

  generateCSV: (params: {
    startDate: string;
    endDate: string;
    dataType: 'transactions' | 'income' | 'investments';
  }) =>
    request<{ downloadUrl: string; fileName: string }>({
      method: 'POST',
      url: '/export/csv',
      data: params,
    }),
};

export default api;
