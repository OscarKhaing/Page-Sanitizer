# Page Sanitizer Agent Runner

A powerful web automation module that uses AI-labeled DOM elements to perform common web tasks safely and reliably. Built on top of the Page Sanitizer labeler.

## 🎯 Purpose

Turn any web page into an automated workflow without writing complex selectors or brittle automation scripts. The Agent Runner uses Page Sanitizer's intelligent DOM labeling to understand web pages semantically and perform actions safely.

## 💡 Key Benefits

- **Write Less Code**: Pre-built templates for common web tasks
- **Safer Automation**: Built-in risk assessment and confidence scoring
- **Self-Maintaining**: Adapts to UI changes automatically
- **Developer Friendly**: Clear APIs and visual debugging tools

## 🚀 Quick Start

```javascript
const { runAgent } = require('page-sanitizer-agent-runner');

// Example: Automated Login
const result = await runAgent({
  url: 'https://example.com/login',
  taskType: 'login',
  inputs: {
    'input-username': 'user@example.com',
    'input-password': 'password123'
  }
});
```

## 📋 Available Tasks

### Account Management
- Login
- Signup
- Password Reset
- Account Deletion

### Transactions
- Payment Processing
- Cart Management
- Purchase Confirmation

### Content Interaction
- Form Submission
- Search
- Navigation
- Messaging

## 🛡️ Safety Features

- Risk-based validation for sensitive actions
- Confidence thresholds for different risk levels
- Visual verification tools
- Comprehensive error handling
- Automatic fallback strategies

## 🔧 Configuration

```javascript
{
  url: string,              // Target webpage
  taskType: string,         // Type of task to perform
  inputs: object,           // Task-specific input data
  useRemoteLabeler: bool,   // Use remote or local labeler
  timeoutMs: number,        // Custom timeout
  dryRun: bool,            // Test without executing
  debugOverlay: bool       // Visual debugging
}
```

## 📊 Example Use Cases

### Customer Service Portal
```javascript
// Quick customer lookup
await runAgent({
  taskType: 'formSubmission',
  inputs: { 'search-box': 'customer123' }
});
```

### E-commerce Monitoring
```javascript
// Check product availability
await runAgent({
  taskType: 'navigation',
  url: 'product-page',
  debugOverlay: true
});
```

### Content Management
```javascript
// Bulk form submission
await runAgent({
  taskType: 'formSubmission',
  inputs: {
    'input-title': 'New Post',
    'input-content': content
  }
});
```

## 🤝 Integration

The Agent Runner works best with the Page Sanitizer labeler but can also:
- Use a remote labeling API
- Work with custom labeling solutions
- Integrate with existing automation frameworks

## 📚 Learn More

- [Page Sanitizer Main Documentation](../README.md)
- [Task Type Reference](docs/tasks.md)
- [Safety Guidelines](docs/safety.md)
- [Integration Guide](docs/integration.md) 