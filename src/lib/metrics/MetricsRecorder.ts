import type { DOMMetrics, MetricsRecorder } from './types';

export class DOMMetricsRecorder implements MetricsRecorder {
  private metrics: DOMMetrics = {
    originalElementCount: 0,
    filteredOutCount: 0,
    labeledElementCount: 0,
    highRiskSkippedCount: 0,
    fallbackUsedCount: 0
  };

  recordOriginalCount(count: number): void {
    this.metrics.originalElementCount = count;
  }

  recordFilteredCount(count: number): void {
    // count represents elements remaining after filtering
    this.metrics.filteredOutCount = this.metrics.originalElementCount - count;
  }

  recordLabeledCount(count: number): void {
    this.metrics.labeledElementCount = count;
  }

  recordHighRiskSkipped(count: number): void {
    this.metrics.highRiskSkippedCount = count;
  }

  recordFallbackUsed(count: number): void {
    this.metrics.fallbackUsedCount = count;
  }

  getMetrics(): DOMMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      originalElementCount: 0,
      filteredOutCount: 0,
      labeledElementCount: 0,
      highRiskSkippedCount: 0,
      fallbackUsedCount: 0
    };
  }
} 