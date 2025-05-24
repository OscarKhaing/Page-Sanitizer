const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected structure for DOM elements
const domElementSchema = {
  type: 'object',
  properties: {
    tag: { type: 'string' },
    id: { type: 'string' },
    class: { type: 'string' },
    text: { type: 'string' },
    boundingBox: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' }
      }
    },
    clickable: { type: 'boolean' },
    visible: { type: 'boolean' },
    disabled: { type: 'boolean' },
    intent: { type: 'string' },
    confidence: { type: 'number' },
    risk: { type: 'string', enum: ['low', 'medium', 'high'] },
    important: { type: 'boolean' },
    fallbackMetadata: {
      type: 'object',
      properties: {
        ariaLabel: { type: 'string' },
        role: { type: 'string' },
        title: { type: 'string' },
        alt: { type: 'string' }
      }
    }
  },
  required: ['tag', 'text', 'intent', 'confidence', 'risk', 'important', 'visible']
};

// Configuration for DOM processing
const CONFIG = {
  // Tags to exclude entirely
  excludeTags: [
    'script', 'style', 'noscript', 'iframe', 'svg', 
    'path', 'meta', 'link', 'head', 'title'
  ],
  
  // Classes/IDs to exclude (partial match)
  excludePatterns: [
    'ad-', 'promo', 'banner', 'social', 'sponsor',
    'cookie', 'popup', 'modal', 'overlay'
  ],
  
  // Always include these interactive elements
  includeElements: [
    'button', 'a', 'input', 'select', 'textarea', 'form'
  ],
  
  // Text content thresholds
  maxTextLength: 1000,
  minTextLength: 2,
  
  // Processing limits
  maxChildren: 50,
  maxDepth: 6,
  
  // OpenAI API limits
  maxTokensPerCall: 12000,
  tokenSafetyMargin: 1000,
  
  // Risk and confidence thresholds
  confidenceThresholds: {
    high: 0.95,    // Required for high-risk actions
    medium: 0.85,  // Required for medium-risk actions
    low: 0.70      // Minimum for any action
  },

  // Risk levels for different intents
  riskLevels: {
    'delete-account': 'high',
    'submit-payment': 'high',
    'confirm-transaction': 'high',
    'send-message': 'medium',
    'submit-form': 'medium',
    'login-button': 'medium',
    'nav-link': 'low',
    'search-box': 'low',
    'footer-link': 'low',
    'close-modal': 'low',
    'other': 'low'
  },

  // Valid intents with risk levels
  validIntents: {
    // High-risk intents
    'delete-account': { risk: 'high', minConfidence: 0.95 },
    'submit-payment': { risk: 'high', minConfidence: 0.95 },
    'confirm-transaction': { risk: 'high', minConfidence: 0.95 },
    
    // Medium-risk intents
    'submit-form': { risk: 'medium', minConfidence: 0.85 },
    'login-button': { risk: 'medium', minConfidence: 0.85 },
    'send-message': { risk: 'medium', minConfidence: 0.85 },
    
    // Low-risk intents
    'nav-link': { risk: 'low', minConfidence: 0.70 },
    'search-box': { risk: 'low', minConfidence: 0.70 },
    'footer-link': { risk: 'low', minConfidence: 0.70 },
    'close-modal': { risk: 'low', minConfidence: 0.70 },
    'other': { risk: 'low', minConfidence: 0.70 }
  }
};

// Helper function to estimate tokens in text
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.toString().length / 4);
}

// Helper function to batch elements based on token count
function batchElements(elements, maxTokens) {
  const batches = [];
  let currentBatch = [];
  let currentTokenCount = 0;

  for (const element of elements) {
    const elementText = JSON.stringify(element);
    const elementTokens = estimateTokens(elementText);

    // If this single element exceeds max tokens, we need to split it
    if (elementTokens > maxTokens) {
      // For now, we'll include it but truncate its text
      // In a more sophisticated version, you might want to split the text itself
      const truncatedElement = {
        ...element,
        text: element.text.slice(0, maxTokens * 4), // Rough character count
        children: [] // Remove children to fit
      };
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      batches.push([truncatedElement]);
      currentBatch = [];
      currentTokenCount = 0;
      continue;
    }

    // If adding this element would exceed the limit, start a new batch
    if (currentTokenCount + elementTokens > maxTokens) {
      batches.push(currentBatch);
      currentBatch = [element];
      currentTokenCount = elementTokens;
    } else {
      currentBatch.push(element);
      currentTokenCount += elementTokens;
    }
  }

  // Don't forget the last batch
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// Process a single batch with OpenAI API
async function processBatch(elements, context, batchIndex) {
  console.log(`Processing batch ${batchIndex + 1} for context: ${context}`);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a DOM processor that labels web elements with their semantic intent, risk level, and importance.

CONTEXT: You are processing batch ${batchIndex + 1} of the following section: ${context}

TASK:
Analyze each DOM element and determine:
1. Semantic intent from valid options (see rules)
2. Confidence score (0.0 to 1.0) in the intent classification
3. Risk level based on the intent
4. Element importance based on:
   - Visibility and clickability
   - Text content relevance
   - Role in page structure
   - User interaction potential

RULES:
1. Each element MUST have:
   - 'intent': One of the valid intents
   - 'confidence': Number between 0.0 and 1.0
   - 'risk': Based on intent's risk level
   - 'important': Boolean based on element significance
2. Risk levels and minimum confidence:
   - High-risk intents (${Object.entries(CONFIG.validIntents)
       .filter(([_, v]) => v.risk === 'high')
       .map(([k, _]) => k)
       .join(', ')}): Require ${CONFIG.confidenceThresholds.high} confidence
   - Medium-risk intents (${Object.entries(CONFIG.validIntents)
       .filter(([_, v]) => v.risk === 'medium')
       .map(([k, _]) => k)
       .join(', ')}): Require ${CONFIG.confidenceThresholds.medium} confidence
   - Low-risk intents (${Object.entries(CONFIG.validIntents)
       .filter(([_, v]) => v.risk === 'low')
       .map(([k, _]) => k)
       .join(', ')}): Require ${CONFIG.confidenceThresholds.low} confidence
3. Consider:
   - Element visibility and clickability
   - Text content and context
   - Fallback metadata (aria-label, role, etc.)
4. If unsure, use:
   - Lower confidence score
   - Higher risk level
   - 'other' intent category

IMPORTANT: Return an array of processed elements, even for a single element.`
      },
      {
        role: "user",
        content: JSON.stringify(Array.isArray(elements) ? elements : [elements])
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "processDOM",
          description: "Process and label a DOM element with intent, confidence, and risk level",
          parameters: {
            type: "object",
            properties: {
              elements: {
                type: "array",
                items: domElementSchema
              }
            },
            required: ["elements"]
          }
        }
      }
    ],
    tool_choice: { type: "function", function: { name: "processDOM" } },
    temperature: 0.2
  });

  const toolCall = completion.choices[0].message.tool_calls[0];
  let processedElements;
  try {
    const result = JSON.parse(toolCall.function.arguments);
    processedElements = result.elements || [];
    if (!Array.isArray(processedElements)) {
      processedElements = [processedElements];
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return [];
  }

  // Validate and adjust confidence scores based on risk levels
  return processedElements.map(element => {
    try {
      const intentConfig = CONFIG.validIntents[element.intent];
      if (!intentConfig) {
        // Fallback to 'other' if intent is not recognized
        return {
          ...element,
          intent: 'other',
          risk: 'low',
          confidence: Math.min(element.confidence || 0, CONFIG.confidenceThresholds.low)
        };
      }

      // Ensure confidence meets minimum threshold for risk level
      const minConfidence = intentConfig.minConfidence;
      if (!element.confidence || element.confidence < minConfidence) {
        // If confidence is too low for the assigned intent, fallback to 'other'
        return {
          ...element,
          intent: 'other',
          risk: 'low',
          confidence: Math.min(element.confidence || 0, CONFIG.confidenceThresholds.low)
        };
      }

      return {
        ...element,
        risk: intentConfig.risk,
        // Ensure confidence doesn't exceed 1.0
        confidence: Math.min(element.confidence, 1.0)
      };
    } catch (error) {
      console.error('Error processing element:', error);
      return {
        ...element,
        intent: 'other',
        risk: 'low',
        confidence: CONFIG.confidenceThresholds.low
      };
    }
  });
}

// Preprocess DOM to remove unnecessary elements and limit size
function preprocessDOM(element, depth = 0) {
  if (!element || depth > CONFIG.maxDepth) return null;

  // Skip excluded tags
  if (CONFIG.excludeTags.includes(element.tag)) return null;

  // Clean and truncate text
  const cleanText = element.text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.maxTextLength);

  // Skip nodes with insufficient content unless they're structural
  // Special handling for academic paper listings
  const isImportantTag = ['dl', 'dt', 'dd', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'article'].includes(element.tag);
  if (cleanText.length < CONFIG.minTextLength && element.children.length === 0 && !isImportantTag) {
    return null;
  }

  // Process children (limited number)
  const processedChildren = element.children
    .slice(0, CONFIG.maxChildren)
    .map(child => preprocessDOM(child, depth + 1))
    .filter(Boolean);

  return {
    tag: element.tag,
    text: cleanText,
    children: processedChildren
  };
}

// Split DOM into manageable chunks based on major sections
function chunkDOM(dom) {
  const chunks = [];
  
  // Helper function to process a chunk of the DOM
  const processChunk = (element, context = '') => {
    if (!element) return;

    let currentChunk = {
      context,
      elements: [],
      tokenCount: 0
    };

    const addToChunk = (el) => {
      const tokenEstimate = estimateTokens(el.text);
      if (currentChunk.tokenCount + tokenEstimate > CONFIG.maxTokensPerCall) {
        if (currentChunk.elements.length > 0) {
          chunks.push(currentChunk);
        }
        currentChunk = {
          context,
          elements: [el],
          tokenCount: tokenEstimate
        };
      } else {
        currentChunk.elements.push(el);
        currentChunk.tokenCount += tokenEstimate;
      }
    };

    // Special handling for academic paper listings
    if (element.tag === 'body') {
      // Handle main content sections
      const mainContent = element.children?.find(child => 
        child.tag === 'main' || child.tag === 'article' || child.tag?.includes('content'));
      
      if (mainContent) {
        // Look for paper sections (usually in dl, ul, or div elements)
        const paperSections = mainContent.children?.filter(child => 
          ['dl', 'ul', 'div'].includes(child.tag) && child.children?.length > 0) || [];
        
        paperSections.forEach((section, index) => {
          processChunk(section, `Paper Listing Section ${index + 1}`);
        });
      }

      // Process remaining elements if no clear paper sections found
      if (!mainContent || !paperSections?.length) {
        element.children?.forEach((child, index) => {
          processChunk(child, `Content Section ${index + 1}`);
        });
      }
    } else {
      addToChunk(element);
    }

    if (currentChunk.elements.length > 0) {
      chunks.push(currentChunk);
    }
  };

  processChunk(dom);
  return chunks;
}

// Add metrics tracking to DOM processing
async function processDOMWithMetrics(dom) {
  const metrics = {
    originalElementCount: 0,
    filteredOutCount: 0,
    labeledElementCount: 0,
    highRiskSkippedCount: 0,
    fallbackUsedCount: 0
  };

  // Count original elements
  const countElements = (node) => {
    if (!node) return 0;
    let count = 1; // Count current node
    if (node.children?.length) {
      count += node.children.reduce((acc, child) => acc + countElements(child), 0);
    }
    return count;
  };
  metrics.originalElementCount = countElements(dom);

  // Process DOM with existing logic
  const chunks = chunkDOM(dom);
  let processedElements = [];
  let highRiskSkipped = 0;
  let fallbacksUsed = 0;

  for (const chunk of chunks) {
    const batches = batchElements(
      chunk.elements, 
      CONFIG.maxTokensPerCall - CONFIG.tokenSafetyMargin
    );
    
    for (const batch of batches) {
      const processed = await processBatch(batch, chunk.context);
      processedElements = processedElements.concat(processed);

      // Track metrics during processing
      processed.forEach(element => {
        if (element.risk === 'high' && element.confidence < CONFIG.confidenceThresholds.high) {
          highRiskSkipped++;
        }
        if (element.fallbackMetadata && Object.values(element.fallbackMetadata).some(v => v)) {
          fallbacksUsed++;
        }
      });
    }
  }

  // Update final metrics
  metrics.labeledElementCount = processedElements.length;
  metrics.filteredOutCount = metrics.originalElementCount - processedElements.length;
  metrics.highRiskSkippedCount = highRiskSkipped;
  metrics.fallbackUsedCount = fallbacksUsed;

  return {
    processedDOM: processedElements,
    metrics
  };
}

app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    console.log(`🔍 Starting to scrape URL: ${url}`);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url);

    // First, get the total element count from the raw DOM
    const totalElementCount = await page.evaluate(() => {
      function countAllElements(element) {
        if (!element) return 0;
        let count = 1; // Count current element
        const children = Array.from(element.children);
        return count + children.reduce((acc, child) => acc + countAllElements(child), 0);
      }
      return countAllElements(document.body);
    });

    const domSnapshot = await page.evaluate((config) => {
      function isVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        // Check computed style properties
        const isStyleVisible = style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             style.opacity !== '0';
        
        // Check if element has size
        const hasSize = rect.width > 0 && rect.height > 0;
        
        // Check if element is within viewport
        const isInViewport = rect.top >= 0 &&
                           rect.left >= 0 &&
                           rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                           rect.right <= (window.innerWidth || document.documentElement.clientWidth);
        
        // Check if element is not covered by other elements
        const elementAtPoint = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        const isTopmost = elementAtPoint && (element === elementAtPoint || element.contains(elementAtPoint));
        
        return isStyleVisible && hasSize && isInViewport && isTopmost;
      }

      function isClickable(element) {
        const tag = element.tagName.toLowerCase();
        const style = window.getComputedStyle(element);
        
        // Check various clickability indicators
        const isInteractive = config.includeElements.includes(tag) ||
                            style.cursor === 'pointer' ||
                            element.onclick != null ||
                            element.getAttribute('role') === 'button';
        
        // Check if element is not disabled
        const isEnabled = !element.disabled && 
                        !element.getAttribute('aria-disabled') === 'true' &&
                        style.pointerEvents !== 'none';
                        
        return isInteractive && isEnabled;
      }

      function getFallbackMetadata(element) {
        return {
          ariaLabel: element.getAttribute('aria-label') || undefined,
          role: element.getAttribute('role') || undefined,
          title: element.getAttribute('title') || undefined,
          alt: element.getAttribute('alt') || undefined,
          placeholder: element.getAttribute('placeholder') || undefined,
          name: element.getAttribute('name') || undefined,
          type: element.getAttribute('type') || undefined
        };
      }

      function shouldExcludeByPattern(element) {
        const patterns = config.excludePatterns;
        const classAndId = `${element.className} ${element.id}`.toLowerCase();
        return patterns.some(pattern => classAndId.includes(pattern));
      }

      function getElementInfo(element) {
        const tag = element.tagName.toLowerCase();
        
        // Skip excluded tags
        if (config.excludeTags.includes(tag)) return null;
        
        // Check exclusion patterns
        if (shouldExcludeByPattern(element)) return null;

        const visible = isVisible(element);
        const clickable = isClickable(element);
        const rect = element.getBoundingClientRect();
        const text = element.textContent.trim();
        const disabled = element.disabled || element.getAttribute('aria-disabled') === 'true';

        // Skip elements with insufficient content unless they're important
        const isImportantElement = config.includeElements.includes(tag) || clickable;
        if (!isImportantElement && text.length < config.minTextLength) {
          return null;
        }

        // Process children
        const children = Array.from(element.children)
          .map(child => getElementInfo(child))
          .filter(Boolean);

        return {
          tag,
          id: element.id || undefined,
          class: element.className || undefined,
          text: text.slice(0, config.maxTextLength),
          boundingBox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          clickable,
          visible,
          disabled,
          fallbackMetadata: getFallbackMetadata(element),
          children: children.slice(0, config.maxChildren)
        };
      }

      return getElementInfo(document.body);
    }, CONFIG);

    await browser.close();
    console.log('✅ Successfully scraped page');

    // Preprocess and chunk the DOM
    const preprocessed = preprocessDOM(domSnapshot);
    console.log('✅ Successfully preprocessed DOM');
    
    const chunks = chunkDOM(preprocessed);
    console.log(`✅ Successfully split DOM into ${chunks.length} chunks`);

    res.json({ chunks, totalElementCount });
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process', async (req, res) => {
  try {
    const { chunks, totalElementCount } = req.body;
    const processedChunks = [];
    console.log(`🔍 Starting to process ${chunks.length} chunks`);

    let totalMetrics = {
      originalElementCount: totalElementCount || 0,
      filteredOutCount: 0,
      labeledElementCount: 0,
      highRiskSkippedCount: 0,
      fallbackUsedCount: 0
    };

    // Process each chunk separately
    for (const chunk of chunks) {
      console.log(`Processing chunk: ${chunk.context}`);
      
      const { processedDOM, metrics } = await processDOMWithMetrics(chunk);
      processedChunks.push({
        context: chunk.context,
        elements: processedDOM
      });

      // Aggregate metrics (except originalElementCount which we got from scraping)
      Object.keys(totalMetrics).forEach(key => {
        if (key !== 'originalElementCount') {
          totalMetrics[key] += metrics[key];
        }
      });

      console.log(`✅ Successfully processed chunk: ${chunk.context}`);
    }

    // Update filteredOutCount based on total elements
    totalMetrics.filteredOutCount = totalMetrics.originalElementCount - totalMetrics.labeledElementCount;

    console.log('✅ Successfully processed all chunks');
    res.json({ 
      processedDOM: processedChunks,
      metrics: totalMetrics
    });
  } catch (error) {
    console.error('❌ Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 