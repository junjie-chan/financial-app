import axios from 'axios';

// ============================================================
// Economic Data Types
// ============================================================

export interface CountryEconomicData {
  country: string;
  countryCode: string;
  gdpGrowth: number;
  inflation: number;
  unemploymentRate: number;
  averageIncome: number; // Monthly USD
  interestRate: number;
  costOfLiving: {
    overall: number;
    rent: number;
    groceries: number;
    transportation: number;
    utilities: number;
    dining: number;
    healthcare: number;
    entertainment: number;
  };
  lastUpdated: string;
}

export interface ProfessionBenchmark {
  profession: string;
  level: string;
  country: string;
  medianMonthly: number; // USD
  p25: number;
  p75: number;
  p90: number;
}

export interface YieldCurveData {
  date: string;
  maturities: Array<{
    maturity: string;
    yield: number;
  }>;
  status: 'normal' | 'flat' | 'inverted';
}

// ============================================================
// Hardcoded Economic Data (updated for 2026)
// ============================================================

const ECONOMIC_DATA: Record<string, CountryEconomicData> = {
  US: {
    country: 'United States',
    countryCode: 'US',
    gdpGrowth: 2.8,
    inflation: 3.2,
    unemploymentRate: 3.9,
    averageIncome: 7500,
    interestRate: 5.25,
    costOfLiving: {
      overall: 100,
      rent: 1800,
      groceries: 450,
      transportation: 200,
      utilities: 180,
      dining: 18,
      healthcare: 400,
      entertainment: 150,
    },
    lastUpdated: new Date().toISOString(),
  },
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    gdpGrowth: 1.2,
    inflation: 4.5,
    unemploymentRate: 4.2,
    averageIncome: 4200,
    interestRate: 5.25,
    costOfLiving: {
      overall: 82,
      rent: 1600,
      groceries: 380,
      transportation: 150,
      utilities: 220,
      dining: 15,
      healthcare: 50,
      entertainment: 120,
    },
    lastUpdated: new Date().toISOString(),
  },
  DE: {
    country: 'Germany',
    countryCode: 'DE',
    gdpGrowth: 0.8,
    inflation: 3.8,
    unemploymentRate: 5.2,
    averageIncome: 4500,
    interestRate: 4.5,
    costOfLiving: {
      overall: 72,
      rent: 1200,
      groceries: 320,
      transportation: 130,
      utilities: 280,
      dining: 14,
      healthcare: 80,
      entertainment: 100,
    },
    lastUpdated: new Date().toISOString(),
  },
  JP: {
    country: 'Japan',
    countryCode: 'JP',
    gdpGrowth: 1.5,
    inflation: 2.8,
    unemploymentRate: 2.6,
    averageIncome: 3500,
    interestRate: 0.1,
    costOfLiving: {
      overall: 68,
      rent: 900,
      groceries: 380,
      transportation: 120,
      utilities: 140,
      dining: 12,
      healthcare: 100,
      entertainment: 90,
    },
    lastUpdated: new Date().toISOString(),
  },
  CA: {
    country: 'Canada',
    countryCode: 'CA',
    gdpGrowth: 1.9,
    inflation: 3.6,
    unemploymentRate: 5.8,
    averageIncome: 5800,
    interestRate: 5.0,
    costOfLiving: {
      overall: 78,
      rent: 1500,
      groceries: 400,
      transportation: 160,
      utilities: 170,
      dining: 16,
      healthcare: 100,
      entertainment: 130,
    },
    lastUpdated: new Date().toISOString(),
  },
  AU: {
    country: 'Australia',
    countryCode: 'AU',
    gdpGrowth: 2.1,
    inflation: 4.0,
    unemploymentRate: 3.8,
    averageIncome: 5500,
    interestRate: 4.35,
    costOfLiving: {
      overall: 80,
      rent: 1700,
      groceries: 420,
      transportation: 150,
      utilities: 200,
      dining: 17,
      healthcare: 80,
      entertainment: 140,
    },
    lastUpdated: new Date().toISOString(),
  },
};

const PROFESSION_BENCHMARKS: ProfessionBenchmark[] = [
  // Software Engineering
  { profession: 'Software Engineering', level: 'junior', country: 'US', medianMonthly: 7000, p25: 5500, p75: 8500, p90: 10000 },
  { profession: 'Software Engineering', level: 'mid', country: 'US', medianMonthly: 10000, p25: 8000, p75: 12500, p90: 15000 },
  { profession: 'Software Engineering', level: 'senior', country: 'US', medianMonthly: 14000, p25: 11000, p75: 18000, p90: 22000 },
  { profession: 'Software Engineering', level: 'lead', country: 'US', medianMonthly: 18000, p25: 14000, p75: 24000, p90: 30000 },
  { profession: 'Software Engineering', level: 'director', country: 'US', medianMonthly: 25000, p25: 20000, p75: 35000, p90: 45000 },
  // Data Science
  { profession: 'Data Science', level: 'junior', country: 'US', medianMonthly: 7500, p25: 6000, p75: 9500, p90: 12000 },
  { profession: 'Data Science', level: 'senior', country: 'US', medianMonthly: 13000, p25: 10000, p75: 17000, p90: 22000 },
  // Product Management
  { profession: 'Product Management', level: 'mid', country: 'US', medianMonthly: 11000, p25: 8500, p75: 14000, p90: 18000 },
  { profession: 'Product Management', level: 'senior', country: 'US', medianMonthly: 16000, p25: 12000, p75: 22000, p90: 28000 },
  // Finance
  { profession: 'Finance', level: 'senior', country: 'US', medianMonthly: 12000, p25: 9000, p75: 16000, p90: 22000 },
  // Healthcare
  { profession: 'Healthcare', level: 'mid', country: 'US', medianMonthly: 8000, p25: 6000, p75: 11000, p90: 15000 },
  { profession: 'Healthcare', level: 'senior', country: 'US', medianMonthly: 15000, p25: 11000, p75: 20000, p90: 28000 },
];

// Cost of Living by City
const CITY_COST_OF_LIVING: Record<string, number> = {
  'San Francisco': 94,
  'New York': 100,
  'Los Angeles': 82,
  'Seattle': 78,
  'Austin': 62,
  'London': 82,
  'Tokyo': 68,
  'Sydney': 80,
  'Toronto': 75,
  'Berlin': 70,
  'Singapore': 88,
  'Dubai': 76,
};

// ============================================================
// Economic Data Service
// ============================================================

class EconomicDataService {
  /**
   * Get economic data for a country
   */
  async getCountryData(countryCode: string): Promise<CountryEconomicData> {
    // Return hardcoded data (in production, would call World Bank API)
    const data = ECONOMIC_DATA[countryCode.toUpperCase()];
    if (data) {
      return data;
    }

    // Default to US data if country not found
    return {
      ...ECONOMIC_DATA['US'],
      country: countryCode,
      countryCode: countryCode,
    };
  }

  /**
   * Attempt to fetch from World Bank API
   */
  async fetchWorldBankData(countryCode: string): Promise<Partial<CountryEconomicData> | null> {
    try {
      const indicators = {
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
        inflation: 'FP.CPI.TOTL.ZG',
        unemployment: 'SL.UEM.TOTL.ZS',
      };

      const requests = Object.entries(indicators).map(async ([key, indicator]) => {
        const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=1&per_page=1`;
        const response = await axios.get(url, { timeout: 5000 });
        const data = response.data;
        if (data && data[1] && data[1][0]) {
          return { key, value: data[1][0].value };
        }
        return { key, value: null };
      });

      const results = await Promise.allSettled(requests);
      const economic: Partial<CountryEconomicData> = {};

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.value !== null) {
          if (result.value.key === 'gdpGrowth') economic.gdpGrowth = result.value.value;
          if (result.value.key === 'inflation') economic.inflation = result.value.value;
          if (result.value.key === 'unemployment') economic.unemploymentRate = result.value.value;
        }
      });

      return economic;
    } catch (error) {
      console.error('World Bank API failed:', error);
      return null;
    }
  }

  /**
   * Get profession salary benchmarks
   */
  getProfessionBenchmark(
    profession: string,
    level: string,
    country: string = 'US'
  ): ProfessionBenchmark {
    const benchmark = PROFESSION_BENCHMARKS.find(
      (b) =>
        b.profession.toLowerCase() === profession.toLowerCase() &&
        b.level.toLowerCase() === level.toLowerCase() &&
        b.country === country
    );

    if (benchmark) return benchmark;

    // Return estimate based on closest match
    const profMatch = PROFESSION_BENCHMARKS.find(
      (b) => b.profession.toLowerCase() === profession.toLowerCase()
    );

    if (profMatch) {
      return { ...profMatch, level };
    }

    // Default benchmark
    return {
      profession,
      level,
      country,
      medianMonthly: 7000,
      p25: 5000,
      p75: 10000,
      p90: 14000,
    };
  }

  /**
   * Get cost of living for a city
   */
  getCostOfLivingIndex(city: string): number {
    const cityKey = Object.keys(CITY_COST_OF_LIVING).find(
      (c) => c.toLowerCase() === city.toLowerCase()
    );
    return cityKey ? CITY_COST_OF_LIVING[cityKey] : 70;
  }

  /**
   * Get yield curve data (mock FRED data)
   */
  getYieldCurve(): YieldCurveData {
    return {
      date: new Date().toISOString().split('T')[0],
      maturities: [
        { maturity: '3M', yield: 5.45 },
        { maturity: '6M', yield: 5.35 },
        { maturity: '1Y', yield: 5.15 },
        { maturity: '2Y', yield: 4.85 },
        { maturity: '5Y', yield: 4.45 },
        { maturity: '10Y', yield: 4.35 },
        { maturity: '30Y', yield: 4.55 },
      ],
      status: 'inverted', // Short-term > long-term = inverted
    };
  }

  /**
   * Determine Kondratiev Wave position
   */
  getKondratievPosition(): {
    wave: number;
    phase: string;
    year: number;
    implication: string;
  } {
    const currentYear = new Date().getFullYear();

    // 5th Wave: 1982-2035 estimated
    // Spring: 1982-1995
    // Summer: 1995-2008
    // Autumn: 2008-2020
    // Winter: 2020-2035

    let phase = 'Winter';
    if (currentYear >= 1982 && currentYear < 1995) phase = 'Spring';
    else if (currentYear >= 1995 && currentYear < 2008) phase = 'Summer';
    else if (currentYear >= 2008 && currentYear < 2020) phase = 'Autumn';
    else phase = 'Winter';

    return {
      wave: 5,
      phase,
      year: currentYear,
      implication:
        phase === 'Winter'
          ? 'Capital preservation phase. Prioritize cash, bonds, gold, and real assets. Avoid speculative tech. Accumulate quality assets at discounted prices for Spring recovery.'
          : phase === 'Autumn'
          ? 'Financialization phase ending. Reduce risk exposure gradually. Financial assets outperform real assets in late Autumn.'
          : phase === 'Summer'
          ? 'Peak growth phase. Inflation risks rise. Commodities and real assets perform well.'
          : 'Recovery phase. Growth stocks and emerging tech outperform.',
    };
  }

  /**
   * Calculate inflation impact on spending
   */
  calculateInflationImpact(
    monthlySpending: number,
    inflationRate: number,
    months: number = 12
  ): {
    currentValue: number;
    futureValue: number;
    purchasingPowerLoss: number;
    annualImpact: number;
  } {
    const monthlyRate = inflationRate / 100 / 12;
    const futureValue = monthlySpending * Math.pow(1 + monthlyRate, months);
    const purchasingPowerLoss = futureValue - monthlySpending;
    const annualImpact = monthlySpending * (inflationRate / 100);

    return {
      currentValue: monthlySpending,
      futureValue,
      purchasingPowerLoss,
      annualImpact,
    };
  }
}

export const economicDataService = new EconomicDataService();
export default economicDataService;
