import React from 'react';
import { Paper, Typography, Box, Skeleton } from '@mui/material';
import type { DOMMetrics } from '../../lib/metrics/types';

interface DOMMetricsSectionProps {
  data?: DOMMetrics;
}

export function DOMMetricsSection({ data }: DOMMetricsSectionProps) {
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        DOM Processing Metrics
      </Typography>
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        <MetricItem
          emoji="🌐"
          label="Original DOM"
          value={data?.originalElementCount}
        />
        <MetricItem
          emoji="🎯"
          label="Labeled Elements"
          value={data?.labeledElementCount}
        />
        <MetricItem
          emoji="🧼"
          label="Filtered"
          value={data?.filteredOutCount}
        />
      </Box>
    </Paper>
  );
}

interface MetricItemProps {
  emoji: string;
  label: string;
  value?: number;
}

function MetricItem({ emoji, label, value }: MetricItemProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h4" component="div" gutterBottom>
        {emoji}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      {value === undefined ? (
        <Skeleton width={60} height={40} />
      ) : (
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      )}
    </Box>
  );
} 