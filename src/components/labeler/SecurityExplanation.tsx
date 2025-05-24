import React from 'react';
import { Paper, Typography, Box, Grid, useTheme, alpha } from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import SecurityIcon from '@mui/icons-material/Security';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';

export function SecurityExplanation() {
  const theme = useTheme();

  const features = [
    {
      icon: <CleaningServicesIcon fontSize="large" />,
      emoji: '🧼',
      title: 'Clean hidden/ads',
      description: 'Automatically filters out hidden elements, advertisements, and non-interactive content'
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      emoji: '🔥',
      title: 'Flag risky elements',
      description: 'Identifies and marks high-risk elements like payment and account deletion buttons'
    },
    {
      icon: <AccessibilityNewIcon fontSize="large" />,
      emoji: '🛟',
      title: 'Use fallbacks',
      description: 'Leverages ARIA labels and other accessibility features for better element identification'
    }
  ];

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Security Features
      </Typography>
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Box sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2
            }}>
              <Box sx={{ 
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                {feature.icon}
                <Typography variant="h4" component="span">
                  {feature.emoji}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
} 