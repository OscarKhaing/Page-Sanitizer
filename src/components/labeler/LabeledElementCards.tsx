import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Chip,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';

interface LabeledElement {
  tag: string;
  text: string;
  intent: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  important: boolean;
  visible: boolean;
  clickable?: boolean;
}

interface LabeledElementCardsProps {
  elements?: LabeledElement[];
}

export function LabeledElementCards({ elements }: LabeledElementCardsProps) {
  const theme = useTheme();

  // Show placeholders if no data
  if (!elements) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Labeled Elements
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" height={60} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Example only — run labeler to see real results
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Labeled Elements ({elements.length})
      </Typography>
      <Grid container spacing={2}>
        {elements.map((element, index) => (
          <Grid item xs={12} md={4} key={index}>
            <ElementCard element={element} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

interface ElementCardProps {
  element: LabeledElement;
}

function ElementCard({ element }: ElementCardProps) {
  const theme = useTheme();
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return theme.palette.error;
      case 'medium': return theme.palette.warning;
      case 'low': return theme.palette.success;
      default: return theme.palette.info;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <BlockIcon fontSize="small" />;
      case 'medium': return <WarningIcon fontSize="small" />;
      case 'low': return <VerifiedIcon fontSize="small" />;
      default: return null;
    }
  };

  const riskColor = getRiskColor(element.risk);

  return (
    <Box sx={{ 
      p: 2, 
      border: 1, 
      borderColor: alpha(riskColor.main, 0.3),
      borderRadius: 1,
      bgcolor: alpha(riskColor.main, 0.05)
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Chip 
          label={element.intent}
          size="small"
          icon={getRiskIcon(element.risk)}
          sx={{ 
            bgcolor: alpha(riskColor.main, 0.1),
            color: riskColor.main,
            borderColor: alpha(riskColor.main, 0.3),
            '& .MuiChip-icon': { color: 'inherit' }
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {(element.confidence * 100).toFixed(0)}% confident
        </Typography>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        {`<${element.tag}>`}
      </Typography>
      
      <Typography variant="body2" sx={{ 
        mt: 1,
        p: 1, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        maxHeight: 80,
        overflow: 'auto'
      }}>
        {element.text || '<no text content>'}
      </Typography>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {element.important && (
          <Chip 
            label="Important"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {element.visible && (
          <Chip 
            label="Visible"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        {element.clickable && (
          <Chip 
            label="Clickable"
            size="small"
            color="info"
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
} 