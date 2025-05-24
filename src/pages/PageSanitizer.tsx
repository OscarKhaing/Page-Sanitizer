import { useState } from 'react'

interface DOMElement {
  tag: string;
  text: string;
  children: DOMElement[];
}

interface LabeledDOMElement extends DOMElement {
  label?: string;
}

const API_URL = 'http://localhost:3001/api';

export function PageSanitizer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalDOM, setOriginalDOM] = useState<DOMElement | null>(null)
  const [processedDOM, setProcessedDOM] = useState<LabeledDOMElement | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOriginalDOM(null)
    setProcessedDOM(null)

    try {
      // First get the raw scraped DOM
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

      const { domSnapshot } = await scrapeResponse.json();
      setOriginalDOM(domSnapshot);

      // Then process it
      const processResponse = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domSnapshot }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process DOM');
      }

      const { processedDOM } = await processResponse.json();
      setProcessedDOM(processedDOM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const renderDOM = (dom: DOMElement | LabeledDOMElement | null, title: string) => {
    if (!dom) return null;
    
    return (
      <div className="dom-display">
        <h3>{title}</h3>
        <pre>
          {JSON.stringify(dom, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="container">
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

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <div className="results">
        {renderDOM(originalDOM, 'Original DOM')}
        {renderDOM(processedDOM, 'Processed DOM')}
      </div>
    </div>
  )
} 