import { useState, useCallback } from 'react';
import { AIAnalysis } from '../types';
import { analysisApi } from '../services/api.service';
import { useFinancialStore } from '../store';

interface AIAnalysisHook {
  latestAnalysis: AIAnalysis | null;
  analyses: AIAnalysis[];
  isGenerating: boolean;
  error: string | null;
  generateReport: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
  loadHistory: () => Promise<void>;
}

export function useAIAnalysis(): AIAnalysisHook {
  const { latestAnalysis, analyses, addAnalysis, setLatestAnalysis } = useFinancialStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await analysisApi.generateReport({
        startDate: params?.startDate,
        endDate: params?.endDate,
        periodType: 'weekly',
      });

      if (response.success && response.data) {
        addAnalysis(response.data as AIAnalysis);
      } else {
        setError(response.error || 'Failed to generate analysis');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate analysis');
    } finally {
      setIsGenerating(false);
    }
  }, [addAnalysis]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await analysisApi.getHistory(10);
      if (response.success && response.data) {
        const analysisArray = Array.isArray(response.data) ? response.data : [];
        analysisArray.forEach((report: AIAnalysis) => {
          addAnalysis(report);
        });
        if (analysisArray.length > 0) {
          setLatestAnalysis(analysisArray[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load analysis history:', err);
    }
  }, [addAnalysis, setLatestAnalysis]);

  return {
    latestAnalysis,
    analyses,
    isGenerating,
    error,
    generateReport,
    loadHistory,
  };
}

export default useAIAnalysis;
