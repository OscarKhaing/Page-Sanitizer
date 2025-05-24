import React from 'react';
import { Paper, Typography, Box, useTheme, alpha } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { DOMMetrics } from '../../lib/metrics/types';

interface DOMFunnelVisualProps {
  data?: DOMMetrics;
}

export function DOMFunnelVisual({ data }: DOMFunnelVisualProps) {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        DOM Processing Pipeline
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        my: 3 
      }}>
        <FunnelBox
          emoji="🗃"
          label="Original DOM"
          count={data?.originalElementCount}
          color={theme.palette.primary.main}
        />
        <ArrowForwardIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
        <FunnelBox
          emoji="🎯"
          label="Labeled Elements"
          count={data?.labeledElementCount}
          color={theme.palette.success.main}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {data ? (
          `${((data.labeledElementCount / data.originalElementCount) * 100).toFixed(1)}% elements retained after processing`
        ) : (
          'Run the labeler to see processing results'
        )}
      </Typography>
    </Paper>
  );
}

interface FunnelBoxProps {
  emoji: string;
  label: string;
  count?: number;
  color: string;
}

function FunnelBox({ emoji, label, count, color }: FunnelBoxProps) {
  return (
    <Box sx={{ 
      p: 2,
      borderRadius: 2,
      bgcolor: alpha(color, 0.1),
      border: 1,
      borderColor: alpha(color, 0.2),
      minWidth: 200
    }}>
      <Typography variant="h4" component="div" gutterBottom>
        {emoji}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" color="text.primary">
        {count ?? '--'}
      </Typography>
    </Box>
  );
} 