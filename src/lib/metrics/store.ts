import { create } from 'zustand';
import type { DOMMetrics } from './types';

interface MetricsState {
  currentMetrics: DOMMetrics | null;
  history: Array<{
    url: string;
    timestamp: number;
    metrics: DOMMetrics;
  }>;
  setMetrics: (metrics: DOMMetrics, url: string) => void;
  clearMetrics: () => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  currentMetrics: null,
  history: [],
  setMetrics: (metrics: DOMMetrics, url: string) => set((state) => ({
    currentMetrics: metrics,
    history: [
      ...state.history,
      {
        url,
        timestamp: Date.now(),
        metrics,
      },
    ],
  })),
  clearMetrics: () => set({ currentMetrics: null }),
})); 