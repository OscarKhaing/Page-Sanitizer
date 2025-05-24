export interface DOMMetrics {
  originalElementCount: number;
  filteredOutCount: number;
  labeledElementCount: number;
  highRiskSkippedCount: number;
  fallbackUsedCount: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  url: string;
  metrics: DOMMetrics;
}

export interface MetricsRecorder {
  recordOriginalCount(count: number): void;
  recordFilteredCount(count: number): void;
  recordLabeledCount(count: number): void;
  recordHighRiskSkipped(count: number): void;
  recordFallbackUsed(count: number): void;
  getMetrics(): DOMMetrics;
  reset(): void;
} 