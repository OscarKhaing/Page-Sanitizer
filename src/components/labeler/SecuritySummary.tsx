import React from 'react';
import { Paper, Typography, Box, useTheme, alpha } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import type { DOMMetrics } from '../../lib/metrics/types';

interface SecuritySummaryProps {
  metrics?: DOMMetrics;
}

export function SecuritySummary({ metrics }: SecuritySummaryProps) {
  const theme = useTheme();

  if (!metrics) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShieldIcon sx={{ color: theme.palette.success.main }} />
        <Typography variant="h6">
          Security Report
        </Typography>
      </Box>

      <Box sx={{ 
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.success.main, 0.05),
        border: 1,
        borderColor: alpha(theme.palette.success.main, 0.2)
      }}>
        <SecurityItem
          emoji="🚨"
          label="High-risk elements skipped"
          value={metrics.highRiskSkippedCount || 0}
          color={theme.palette.error.main}
        />
        <SecurityItem
          emoji="👻"
          label="Hidden/invisible removed"
          value={metrics.filteredOutCount || 0}
          color={theme.palette.warning.main}
        />
        <SecurityItem
          emoji="🛟"
          label="Fallback selectors used"
          value={metrics.fallbackUsedCount || 0}
          color={theme.palette.info.main}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        {`${metrics.highRiskSkippedCount || 0} potential security risks mitigated`}
      </Typography>
    </Paper>
  );
}

interface SecurityItemProps {
  emoji: string;
  label: string;
  value: number;
  color: string;
}

function SecurityItem({ emoji, label, value, color }: SecurityItemProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      mb: 2,
      '&:last-child': { mb: 0 }
    }}>
      <Typography variant="h6">{emoji}</Typography>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ color }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
} 