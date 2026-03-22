import { useEffect, useState } from 'react';
import { EconomicData, KondratievPhase } from '../types';
import { economicApi } from '../services/api.service';
import { useFinancialStore } from '../store';

interface EconomicDataHook {
  economicData: EconomicData | null;
  kondratievPhase: KondratievPhase;
  kondratievImplication: string;
  yieldCurveStatus: 'Normal' | 'Flat' | 'Inverted';
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEconomicData(): EconomicDataHook {
  const { economicData, setEconomicData, settings } = useFinancialStore();
  const [kondratievPhase, setKondratievPhase] = useState<KondratievPhase>(KondratievPhase.Winter);
  const [kondratievImplication, setKondratievImplication] = useState('');
  const [yieldCurveStatus, setYieldCurveStatus] = useState<'Normal' | 'Flat' | 'Inverted'>('Inverted');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEconomicData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [countryRes, yieldRes] = await Promise.allSettled([
        economicApi.getCountryData(settings.countryCode),
        economicApi.getYieldCurve(),
      ]);

      if (countryRes.status === 'fulfilled' && countryRes.value.success && countryRes.value.data) {
        setEconomicData(countryRes.value.data);
      }

      if (yieldRes.status === 'fulfilled' && yieldRes.value.success && yieldRes.value.data) {
        const data = yieldRes.value.data as Array<{ maturity: string; yield: number }>;
        const threeMonth = data.find((d) => d.maturity === '3M')?.yield || 5;
        const tenYear = data.find((d) => d.maturity === '10Y')?.yield || 4;

        if (threeMonth > tenYear + 0.5) {
          setYieldCurveStatus('Inverted');
        } else if (Math.abs(threeMonth - tenYear) < 0.3) {
          setYieldCurveStatus('Flat');
        } else {
          setYieldCurveStatus('Normal');
        }
      }

      // Kondratiev position (2026 = Winter phase)
      setKondratievPhase(KondratievPhase.Winter);
      setKondratievImplication(
        'We are currently in the Winter phase of the 5th Kondratiev Wave (est. 2020-2035). ' +
        'This phase is characterized by debt deleveraging, deflationary pressures, and systemic restructuring. ' +
        'Capital preservation and accumulation of quality assets at discounted prices is the recommended strategy.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load economic data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEconomicData();
  }, [settings.countryCode]);

  return {
    economicData,
    kondratievPhase,
    kondratievImplication,
    yieldCurveStatus,
    isLoading,
    error,
    refresh: fetchEconomicData,
  };
}

export default useEconomicData;
