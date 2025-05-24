import { useState } from 'react'
import { Container } from '@mui/material'
import { useMetricsStore } from '../lib/metrics/store'
import { MetricsDisplay } from '../components/MetricsDisplay'

interface DOMElement {
  tag: string;
  text: string;
  children: DOMElement[];
}

interface LabeledDOMElement extends DOMElement {
  label?: string;
}

interface DOMChunk {
  context: string;
  elements: DOMElement[];
}

interface ProcessedDOMChunk {
  context: string;
  elements: LabeledDOMElement[];
}

const API_URL = 'http://localhost:3001/api';

export function PageSanitizer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [originalChunks, setOriginalChunks] = useState<DOMChunk[] | null>(null)
  const [processedChunks, setProcessedChunks] = useState<ProcessedDOMChunk[] | null>(null)
  const setMetrics = useMetricsStore((state) => state.setMetrics)
  const clearMetrics = useMetricsStore((state) => state.clearMetrics)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStatus('')
    setOriginalChunks(null)
    setProcessedChunks(null)
    clearMetrics()

    try {
      // First get the raw scraped DOM
      setStatus('Scraping page...');
      const scrapeResponse = await fetch(`${API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!scrapeResponse.ok) {
        throw new Error('Failed to scrape page');
      }

      const { chunks } = await scrapeResponse.json();
      setOriginalChunks(chunks);
      setStatus(`Successfully scraped page into ${chunks.length} sections`);

      // Then process the chunks
      setStatus('Processing DOM chunks...');
      const processResponse = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunks }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process DOM');
      }

      const { processedDOM, metrics } = await processResponse.json();
      setProcessedChunks(processedDOM);
      setMetrics(metrics, url);
      setStatus('✨ Successfully processed all sections!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  const renderChunks = (chunks: DOMChunk[] | ProcessedDOMChunk[] | null, title: string) => {
    if (!chunks) return null;
    
    return (
      <div className="dom-display">
        <h3>{title}</h3>
        {chunks.map((chunk, index) => (
          <div key={index} className="chunk">
            <h4>{chunk.context || 'Unknown Section'}</h4>
            <pre>
              {JSON.stringify(chunk.elements, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Container maxWidth="lg">
      <h1>Page Sanitizer</h1>
      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          required
          className="url-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Processing...' : 'Process Page'}
        </button>
      </form>

      {status && (
        <div className="status">
          {status}
        </div>
      )}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <MetricsDisplay />

      <div className="results">
        {renderChunks(originalChunks, 'Original DOM')}
        {renderChunks(processedChunks, 'Processed DOM')}
      </div>
    </Container>
  )
} 