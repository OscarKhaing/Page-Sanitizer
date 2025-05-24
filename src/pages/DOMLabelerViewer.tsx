import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  useTheme,
  alpha,
  Tab,
  Tabs,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LanguageIcon from '@mui/icons-material/Language';
import { useMetricsStore } from '../lib/metrics/store';
import {
  DOMMetricsSection,
  DOMFunnelVisual,
  LabeledElementCards,
  SecurityExplanation,
  SecuritySummary,
  CleanDOMDisplay
} from '../components/labeler';
import type { DOMMetrics } from '../lib/metrics/types';

interface DOMElement {
  tag: string;
  text: string;
  children?: DOMElement[];
}

interface DOMChunk {
  context: string;
  elements: DOMElement[];
}

interface ProcessedData {
  metrics: DOMMetrics;
  processedDOM: Array<{
    context: string;
    elements: Array<{
      tag: string;
      text: string;
      intent: string;
      confidence: number;
      risk: 'low' | 'medium' | 'high';
      important: boolean;
      visible: boolean;
      clickable?: boolean;
    }>;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const API_URL = 'http://localhost:3001/api';

export function DOMLabelerViewer() {
  const theme = useTheme();
  const [domInput, setDomInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [rawChunks, setRawChunks] = useState<DOMChunk[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const setMetrics = useMetricsStore(state => state.setMetrics);
  const clearMetrics = useMetricsStore(state => state.clearMetrics);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setRawChunks(null);
  };

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    clearMetrics();
    setProcessedData(null);
    setRawChunks(null);

    try {
      let data;
      if (activeTab === 0) { // URL input
        console.log('Sending scrape request for URL:', urlInput);
        // Step 1: Scrape the page
        const scrapeResponse = await fetch(`${API_URL}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput }),
        });

        if (!scrapeResponse.ok) {
          const errorData = await scrapeResponse.json().catch(() => ({ message: 'Failed to scrape page' }));
          throw new Error(errorData.message || 'Failed to scrape page');
        }

        const { chunks, totalElementCount } = await scrapeResponse.json();
        console.log('Scraped chunks:', chunks, 'Total elements:', totalElementCount);
        setRawChunks(chunks);

        // Step 2: Process the chunks
        const processResponse = await fetch(`${API_URL}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunks, totalElementCount }),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({ message: 'Failed to process DOM' }));
          throw new Error(errorData.message || 'Failed to process DOM');
        }

        data = await processResponse.json();
      } else { // JSON input
        // For JSON input, we need to count elements before processing
        const elements = JSON.parse(domInput);
        const countElements = (el: DOMElement): number => {
          if (!el) return 0;
          let count = 1;
          if (Array.isArray(el.children)) {
            count += el.children.reduce((acc: number, child: DOMElement) => acc + countElements(child), 0);
          }
          return count;
        };
        const totalElementCount = countElements(elements);
        const initialChunks = [{ context: 'Main Content', elements }];
        setRawChunks(initialChunks);

        const response = await fetch(`${API_URL}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chunks: initialChunks,
            totalElementCount
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to process DOM' }));
          throw new Error(errorData.message || 'Failed to process DOM');
        }

        data = await response.json();
      }

      console.log('Final processed data:', data);

      // Validate the response format
      if (!data) {
        throw new Error('Empty response from server');
      }

      if (!data.metrics) {
        console.error('Invalid response structure:', data);
        throw new Error('Response missing metrics data');
      }

      // Validate required metrics fields
      const requiredMetrics = [
        'originalElementCount',
        'filteredOutCount',
        'labeledElementCount',
        'highRiskSkippedCount',
        'fallbackUsedCount'
      ];

      const missingMetrics = requiredMetrics.filter(metric => 
        typeof data.metrics[metric] === 'undefined'
      );

      if (missingMetrics.length > 0) {
        console.error('Missing required metrics:', missingMetrics);
        throw new Error(`Response missing required metrics: ${missingMetrics.join(', ')}`);
      }

      if (!Array.isArray(data.processedDOM)) {
        console.error('Invalid processedDOM structure:', data.processedDOM);
        throw new Error('Response missing or invalid processedDOM data');
      }

      // Flatten the processed DOM chunks into a single array of elements
      const flattenedElements = data.processedDOM.reduce((acc: Array<any>, chunk: { elements: Array<any> }) => {
        if (Array.isArray(chunk.elements)) {
          return [...acc, ...chunk.elements];
        }
        return acc;
      }, []);

      setProcessedData({
        metrics: data.metrics,
        processedDOM: flattenedElements
      });
      setMetrics(data.metrics, activeTab === 0 ? urlInput : 'manual-input');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessedData(null);
      setRawChunks(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    if (activeTab === 0) {
      setUrlInput('https://example.com');
    } else {
      setDomInput(JSON.stringify({
        tag: 'div',
        text: 'Example DOM structure',
        children: [
          {
            tag: 'button',
            text: 'Submit Payment',
            clickable: true,
            visible: true
          },
          {
            tag: 'input',
            text: '',
            placeholder: 'Enter card number',
            visible: true
          }
        ]
      }, null, 2));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 1. Intro Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          🧠 DOM Labeler
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Turn noisy webpages into clean, agent-readable structures
        </Typography>
      </Box>

      {/* 2. Upload + Usage Guide */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4,
          background: alpha(theme.palette.primary.main, 0.05)
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<LanguageIcon />} label="URL Input" />
            <Tab icon={<UploadFileIcon />} label="JSON Input" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter webpage URL (e.g., https://example.com)"
              variant="outlined"
              error={!!error}
              helperText={error}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleProcess}
                disabled={loading || !urlInput}
                startIcon={<AutoFixHighIcon />}
                sx={{ minWidth: '150px' }}
              >
                {loading ? 'Processing...' : 'Analyze URL'}
              </Button>
              <Button
                variant="outlined"
                onClick={loadExample}
                startIcon={<UploadFileIcon />}
              >
                Try Example
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              multiline
              rows={8}
              fullWidth
              value={domInput}
              onChange={(e) => setDomInput(e.target.value)}
              placeholder="Paste your DOM structure here (JSON format)"
              variant="outlined"
              error={!!error}
              helperText={error}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleProcess}
                disabled={loading || !domInput}
                startIcon={<AutoFixHighIcon />}
                sx={{ minWidth: '150px' }}
              >
                {loading ? 'Processing...' : 'Run Labeler'}
              </Button>
              <Button
                variant="outlined"
                onClick={loadExample}
                startIcon={<UploadFileIcon />}
              >
                Try Example
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <Typography variant="h6" gutterBottom>Quick Guide:</Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li">
            {activeTab === 0 
              ? "Enter a webpage URL to analyze" 
              : "Paste your DOM structure in JSON format"}
          </Typography>
          <Typography component="li">
            Click "{activeTab === 0 ? 'Analyze URL' : 'Run Labeler'}" to process
          </Typography>
          <Typography component="li">View the cleaned and labeled output below</Typography>
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 4, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Show results if we have either raw chunks or processed data */}
      {(processedData || rawChunks) && !error && (
        <>
          {processedData && (
            <>
              <DOMMetricsSection data={processedData.metrics} />
              <DOMFunnelVisual data={processedData.metrics} />
            </>
          )}
          {rawChunks && <CleanDOMDisplay chunks={rawChunks} />}
          {processedData && (
            <>
              <LabeledElementCards elements={processedData.processedDOM} />
              <SecurityExplanation />
              <SecuritySummary metrics={processedData.metrics} />
            </>
          )}
        </>
      )}
    </Container>
  );
} 