const puppeteer = require('puppeteer');
const axios = require('axios');

// Configuration constants
const DEFAULT_TIMEOUT = 5000;
const CONFIDENCE_THRESHOLDS = {
  high: 0.95,
  medium: 0.85,
  low: 0.70
};

// Task-specific action plans
const ACTION_PLANS = {
  // Account Management Tasks
  login: [
    { intent: 'input-username', action: 'type', required: true },
    { intent: 'input-password', action: 'type', required: true },
    { intent: 'login-button', action: 'click', required: true }
  ],
  
  signup: [
    { intent: 'input-username', action: 'type', required: true },
    { intent: 'input-email', action: 'type', required: true },
    { intent: 'input-password', action: 'type', required: true },
    { intent: 'input-confirm-password', action: 'type', required: true },
    { intent: 'submit-form', action: 'click', required: true }
  ],

  deleteAccount: [
    { intent: 'delete-account', action: 'click', required: true },
    { intent: 'confirm-transaction', action: 'click', required: true }
  ],

  resetPassword: [
    { intent: 'input-email', action: 'type', required: true },
    { intent: 'submit-form', action: 'click', required: true }
  ],

  // Transaction Tasks
  payment: [
    { intent: 'input-card-number', action: 'type', required: true },
    { intent: 'input-expiry', action: 'type', required: true },
    { intent: 'input-cvv', action: 'type', required: true },
    { intent: 'submit-payment', action: 'click', required: true }
  ],

  purchase: [
    { intent: 'submit-payment', action: 'click', required: true },
    { intent: 'confirm-transaction', action: 'click', required: true }
  ],

  cartManagement: [
    { intent: 'input-quantity', action: 'type', required: false },
    { intent: 'update-cart', action: 'click', required: false },
    { intent: 'checkout-button', action: 'click', required: true }
  ],

  // Content Interaction Tasks
  search: [
    { intent: 'search-box', action: 'type', required: true },
    { intent: 'submit-form', action: 'click', required: false }
  ],

  navigation: [
    { intent: 'nav-link', action: 'click', required: true }
  ],

  formSubmission: [
    { intent: 'input-text', action: 'type', required: false },
    { intent: 'input-email', action: 'type', required: false },
    { intent: 'input-textarea', action: 'type', required: false },
    { intent: 'submit-form', action: 'click', required: true }
  ],

  messaging: [
    { intent: 'input-textarea', action: 'type', required: true },
    { intent: 'send-message', action: 'click', required: true }
  ],

  modalInteraction: [
    { intent: 'close-modal', action: 'click', required: true }
  ]
};

/**
 * Main entry point for running the agent
 */
async function runAgent(config) {
  validateConfig(config);
  
  const {
    url,
    taskType,
    inputs = {},
    useRemoteLabeler = false,
    timeoutMs = DEFAULT_TIMEOUT,
    dryRun = false,
    debugOverlay = false,
    retryIfMissing = true,
    screenshotOnError = true,
    logActions = true
  } = config;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Load page and wait for network to settle
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get labeled elements
    const labels = await getLabeledElements(page, useRemoteLabeler);
    
    if (debugOverlay) {
      await visualizeLabels(page, labels);
    }

    // Plan and execute actions
    const result = await planAndExecute({
      page,
      labels,
      taskType,
      inputs,
      timeoutMs,
      dryRun,
      retryIfMissing,
      screenshotOnError,
      logActions
    });

    return result;

  } catch (error) {
    const errorResult = await handleError(error, page, screenshotOnError);
    return errorResult;
  } finally {
    await browser.close();
  }
}

/**
 * Get labeled elements either from remote API or local labeler
 */
async function getLabeledElements(page, useRemoteLabeler) {
  if (useRemoteLabeler) {
    const response = await axios.post('http://localhost:3001/api/process', {
      url: page.url()
    });
    return response.data.processedDOM;
  } else {
    // Run local labeler
    return await page.evaluate(() => window.runLabeler());
  }
}

/**
 * Plan and execute actions based on labeled elements
 */
async function planAndExecute({
  page,
  labels,
  taskType,
  inputs,
  timeoutMs,
  dryRun,
  retryIfMissing,
  screenshotOnError,
  logActions
}) {
  // Filter usable labels
  const usableLabels = labels.filter(isUsableLabel);
  
  // Get plan for task type
  const plan = ACTION_PLANS[taskType];
  if (!plan) {
    throw new Error(`Unknown task type: ${taskType}`);
  }

  if (dryRun) {
    return {
      status: 'dry-run',
      plannedActions: plan,
      usableLabels: usableLabels
    };
  }

  // Track actions taken
  const actionsTaken = [];
  const missingIntents = [];

  // Execute each action in plan
  for (const step of plan) {
    const label = findBestMatch(usableLabels, step.intent);
    
    if (!label) {
      if (step.required) {
        missingIntents.push(step.intent);
        if (!retryIfMissing) break;
      }
      continue;
    }

    try {
      await runWithTimeout(async () => {
        await executeAction(page, label, step.action, inputs[step.intent]);
        actionsTaken.push(`${step.action} ${step.intent}`);
        if (logActions) {
          console.log(`✅ ${step.action} ${step.intent}`);
        }
      }, timeoutMs);
    } catch (error) {
      if (screenshotOnError) {
        await page.screenshot({
          path: `error_${Date.now()}.png`,
          fullPage: true
        });
      }
      throw error;
    }
  }

  // Return appropriate status
  if (missingIntents.length > 0) {
    return {
      status: 'incomplete',
      reason: 'intent-not-found',
      missingIntents,
      actionsAttempted: actionsTaken,
      recoveryHint: 'Retry labeler after DOM settles',
      fallbackUI: {
        message: `Could not find ${missingIntents.join(', ')} on this page.`,
        suggestion: 'Try refreshing or entering manually.'
      }
    };
  }

  return {
    status: 'success',
    actionsTaken,
    timeMs: Date.now() // You might want to track actual start time
  };
}

/**
 * Execute a single action on an element
 */
async function executeAction(page, label, action, input) {
  const selector = getSelector(label);
  
  await page.waitForSelector(selector, { visible: true });
  
  switch (action) {
    case 'click':
      await page.click(selector);
      break;
    case 'type':
      await page.type(selector, input);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Get best selector for an element
 */
function getSelector(label) {
  if (label.id) return `#${label.id}`;
  if (label.fallbackMetadata?.ariaLabel) {
    return `[aria-label="${label.fallbackMetadata.ariaLabel}"]`;
  }
  // Fallback to other selectors
  if (label.class) return `.${label.class.split(' ')[0]}`;
  return `xpath://*[contains(text(),'${label.text}')]`;
}

/**
 * Check if a label is usable based on visibility and confidence
 */
function isUsableLabel(label) {
  if (!label.visible || label.disabled) return false;
  
  const minConfidence = CONFIDENCE_THRESHOLDS[label.risk];
  if (!minConfidence) return false;
  
  return label.confidence >= minConfidence;
}

/**
 * Find best matching label for an intent
 */
function findBestMatch(labels, intent) {
  return labels
    .filter(l => l.intent === intent)
    .sort((a, b) => {
      // Prefer important elements
      if (a.important !== b.important) return b.important ? 1 : -1;
      // Then by confidence
      return b.confidence - a.confidence;
    })[0];
}

/**
 * Run a function with timeout
 */
async function runWithTimeout(fn, timeoutMs) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Action timed out')), timeoutMs)
    )
  ]);
}

/**
 * Validate the input configuration
 */
function validateConfig(config) {
  const { url, taskType } = config;
  
  if (!url) throw new Error('URL is required');
  if (!taskType) throw new Error('Task type is required');
  if (!ACTION_PLANS[taskType]) {
    throw new Error(`Unknown task type: ${taskType}`);
  }
}

/**
 * Handle errors and generate error response
 */
async function handleError(error, page, screenshotOnError) {
  if (screenshotOnError) {
    await page.screenshot({
      path: `error_${Date.now()}.png`,
      fullPage: true
    });
  }

  return {
    status: 'failure',
    reason: error.message,
    error: error.toString(),
    screenshotPath: screenshotOnError ? `error_${Date.now()}.png` : undefined
  };
}

/**
 * Visualize labeled elements for debugging
 */
async function visualizeLabels(page, labels) {
  await page.evaluate((labels) => {
    labels.forEach(label => {
      const el = document.querySelector(getSelector(label));
      if (el) {
        el.style.outline = `2px solid ${getColorForRisk(label.risk)}`;
        el.setAttribute('data-intent', label.intent);
        el.setAttribute('data-confidence', label.confidence);
      }
    });
  }, labels);
}

/**
 * Get color for risk level visualization
 */
function getColorForRisk(risk) {
  switch (risk) {
    case 'high': return '#ff4444';
    case 'medium': return '#ffaa00';
    case 'low': return '#44ff44';
    default: return '#cccccc';
  }
}

module.exports = {
  runAgent,
  planAndExecute,
  getLabeledElements,
  // Export other functions as needed
}; 