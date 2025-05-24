import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { useMetricsStore } from '../lib/metrics/store';

export const MetricsDisplay: React.FC = () => {
  const metrics = useMetricsStore((state) => state.currentMetrics);

  if (!metrics) return null;

  return (
    <Paper sx={{ p: 2, my: 2 }}>
      <Typography variant="h6" gutterBottom>
        DOM Processing Metrics
      </Typography>
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
        <MetricItem 
          label="Original Elements" 
          value={metrics.originalElementCount} 
        />
        <MetricItem 
          label="Filtered Out" 
          value={metrics.filteredOutCount}
          color="warning.main"
        />
        <MetricItem 
          label="Labeled Elements" 
          value={metrics.labeledElementCount}
          color="success.main"
        />
        <MetricItem 
          label="High Risk Skipped" 
          value={metrics.highRiskSkippedCount}
          color="error.main"
        />
        <MetricItem 
          label="Fallbacks Used" 
          value={metrics.fallbackUsedCount}
          color="info.main"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {`${((metrics.labeledElementCount / metrics.originalElementCount) * 100).toFixed(1)}% of elements retained after processing`}
      </Typography>
    </Paper>
  );
};

interface MetricItemProps {
  label: string;
  value: number;
  color?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, color = 'text.primary' }) => (
  <Box>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" color={color}>
      {value}
    </Typography>
  </Box>
); 