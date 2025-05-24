# Page Sanitizer

A powerful web application that simplifies and analyzes web page DOMs using AI. It extracts important elements, determines their intent, and provides a clean, structured representation of the page content with built-in safety mechanisms and confidence scoring.

## 🤖 Agent Runner Module

The Agent Runner is a **separate automation module** that consumes Page Sanitizer's labeled elements to perform common web tasks safely and reliably.

### Business Value

- **Reduced Development Time**: Turn labeled web pages into automated workflows without writing custom selectors
- **Enhanced Reliability**: Built-in safety checks prevent risky actions and ensure high-confidence interactions
- **Lower Maintenance**: Self-adjusting to UI changes through semantic understanding rather than brittle selectors
- **Risk Management**: Automatic detection and special handling of high-risk actions like payments and account changes

### Key Features

- **Pre-built Task Templates**
  - Account Management (login, signup, password reset)
  - Payment Processing
  - Form Submissions
  - Content Search & Navigation
  
- **Safety First Approach**
  - Risk-based validation
  - Confidence scoring
  - Automatic fallbacks
  - Visual debugging tools

### Common Use Cases

1. **Customer Service Tools**
   - Quick account lookups
   - Automated form filling
   - Bulk data entry

2. **E-commerce Operations**
   - Inventory checks
   - Price monitoring
   - Order processing

3. **Content Management**
   - Bulk content updates
   - Cross-platform posting
   - Form submissions

4. **Testing & Monitoring**
   - User flow validation
   - Availability checks
   - Performance monitoring

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────────┐      ┌──────────────────────────────────────┐
│                     Page Sanitizer Labeler                    │      │         Agent Runner Module          │
│                                                               │      │                                      │
│  ┌─────────────────────────────────────┐      ┌──────────┐   │      │    ┌────────────────────────────┐   │
│  │           Frontend (React)          │      │ Backend   │   │      │    │      Task Executor         │   │
│  │                                    │      │ (Node.js) │   │      │    │                            │   │
│  │  ┌────────────────────────────┐    │      │          │   │      │    │  ┌──────────┐  ┌────────┐  │   │
│  │  │      React Components      │    │      │  Express  │   │      │    │  │ Action   │  │Safety  │  │   │
│  │  │                           │    │      │  Server   │   │      │    │  │ Planner  │  │Checks  │  │   │
│  │  │  ┌─────────┐  ┌─────────┐ │    │      │          │   │      │    │  └──────────┘  └────────┘  │   │
│  │  │  │URL Input│  │Results  │ │    │ REST │┌────────┐│   │ JSON │    │                            │   │
│  │  │  │Component│  │Display  │ │◄───┼─API─┼┤Puppeteer├┼───┼─────────► │  ┌──────────┐  ┌────────┐  │   │
│  │  │  └─────────┘  └─────────┘ │    │      │└────────┘│   │      │    │  │Puppeteer │  │Fallback│  │   │
│  │  │                           │    │      │┌───────┐ │   │      │    │  │Runner    │  │Handler │  │   │
│  │  └────────────────────────────┘    │      ││OpenAI  │ │   │      │    │  └──────────┘  └────────┘  │   │
│  │                                    │      ││GPT-4   │ │   │      │    │                            │   │
│  │  React State Management           │      │└───────┘ │   │      │    └────────────────────────────┘   │
│  │  ┌────────────────────────────┐    │      │          │   │      │                                      │
│  │  │  ┌─────────┐ ┌──────────┐  │    │      │Pipeline: │   │      │    Pre-built Task Types:            │
│  │  │  │ Loading │ │ Results  │  │    │      │1. Extract│   │      │    ┌─────────┐ ┌─────────┐          │
│  │  │  │ States  │ │  Cache   │  │    │      │2. Filter │   │      │    │Account  │ │Payment  │          │
│  │  │  └─────────┘ └──────────┘  │    │      │3. Analyze│   │      │    │Tasks    │ │Tasks    │          │
│  │  └────────────────────────────┘    │      │4. Label  │   │      │    └─────────┘ └─────────┘          │
│  │                                    │      │5. Score  │   │      │    ┌─────────┐ ┌─────────┐          │
│  └─────────────────────────────────────┘      └──────────┘   │      │    │Content  │ │Form     │          │
│                                                               │      │    │Tasks    │ │Tasks    │          │
└───────────────────────────────────────────────────────────────┘      │    └─────────┘ └─────────┘          │
                                                                       └──────────────────────────────────────┘
```

## 🛡️ Safety Features

### Risk Assessment
- **High-Risk Actions** (95% confidence required)
  - Account deletion
  - Payment submission
  - Transaction confirmation
- **Medium-Risk Actions** (85% confidence required)
  - Form submission
  - Login attempts
  - Message sending
- **Low-Risk Actions** (70% confidence required)
  - Navigation
  - Search
  - UI controls

### Visibility Analysis
- **Style Checks**
  - Display property
  - Visibility state
  - Opacity value
- **Geometric Validation**
  - Viewport boundaries
  - Element dimensions
  - Z-index/overlay detection
- **Interaction Potential**
  - Clickability assessment
  - Disabled state detection
  - Pointer events validation

### Fallback Mechanisms
- **Metadata Collection**
  - ARIA attributes
  - Role information
  - Title and alt text
  - Placeholder content
- **Graceful Degradation**
  - Intent fallback to 'other'
  - Confidence thresholds
  - Risk level adjustments

## 🔍 DOM Processing

### Element Schema
```typescript
interface ProcessedElement {
  // Basic Information
  tag: string;
  id?: string;
  class?: string;
  text: string;

  // Positioning and Visibility
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;
  clickable: boolean;
  disabled: boolean;

  // AI Analysis
  intent: string;
  confidence: number;  // 0.0 to 1.0
  risk: 'low' | 'medium' | 'high';
  important: boolean;

  // Fallback Data
  fallbackMetadata: {
    ariaLabel?: string;
    role?: string;
    title?: string;
    alt?: string;
    placeholder?: string;
    name?: string;
    type?: string;
  };
}
```
<!-- ### Frontend ######## TECHNICALLY THIS DOESN'T EXIST YET
```
React (TypeScript)
    │
    ├── 📱 UI Components
    │   ├── Material-UI: Modern UI framework
    │   ├── React JSON Tree: DOM visualization
    │   └── Syntax Highlighter: Code display
    │
    ├── 🔄 State Management
    │   └── React Hooks: useState for component state
    │
    └── 🌐 API Integration
        └── Fetch API: Backend communication

``` --> 
### Backend Pipeline
```
Input URL
    │
    ▼
┌─────────────┐
│  Puppeteer  │ DOM Extraction & Initial Processing
└─────────────┘
    │   ├── Extract DOM structure
    │   ├── Compute visibility metrics
    │   └── Calculate bounding boxes
    ▼
┌─────────────┐
│  Processor  │ Element Analysis & Filtering
└─────────────┘
    │   ├── Remove unwanted elements
    │   ├── Apply heuristic rules
    │   └── Chunk large DOMs
    ▼
┌─────────────┐
│   OpenAI    │ Semantic Analysis
└─────────────┘
    │   ├── Determine element intent
    │   ├── Assess importance
    │   └── Generate labels
    ▼
Processed DOM
```

### Intent Categories
```typescript
const validIntents = {
  // High-risk intents (95% confidence required)
  'delete-account': { risk: 'high', minConfidence: 0.95 },
  'submit-payment': { risk: 'high', minConfidence: 0.95 },
  'confirm-transaction': { risk: 'high', minConfidence: 0.95 },
  
  // Medium-risk intents (85% confidence required)
  'submit-form': { risk: 'medium', minConfidence: 0.85 },
  'login-button': { risk: 'medium', minConfidence: 0.85 },
  'send-message': { risk: 'medium', minConfidence: 0.85 },
  
  // Low-risk intents (70% confidence required)
  'nav-link': { risk: 'low', minConfidence: 0.70 },
  'search-box': { risk: 'low', minConfidence: 0.70 },
  'footer-link': { risk: 'low', minConfidence: 0.70 },
  'close-modal': { risk: 'low', minConfidence: 0.70 },
  'other': { risk: 'low', minConfidence: 0.70 }
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/page-sanitizer.git
cd page-sanitizer
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Set up environment variables:
```bash
# In server directory
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. Start the application:
```bash
# Start backend server (from server directory)
npm start

# Start frontend (from project root)
npm run dev
```

## 💡 Usage

1. Open the application in your browser (default: http://localhost:5173)
2. Enter a URL in the input field
3. Click "Process Page"
4. View the processed results:
   - Original DOM structure
   - Processed DOM with intent labels, confidence scores, and risk levels
   - Visibility and interaction analysis
   - Fallback metadata when available

## 🔒 Security

- CORS enabled for frontend-backend communication
- Request size limits enforced
- API key stored in environment variables
- Input validation for URLs and DOM elements
- Risk-based confidence thresholds
- Strict visibility and interaction validation

## 📦 Dependencies

### Frontend
- React 17
- TypeScript
- Material-UI
- React JSON Tree
- React Syntax Highlighter

### Backend
- Express
- Puppeteer
- OpenAI Node.js SDK
- CORS
- dotenv

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
