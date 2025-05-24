const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected structure for DOM elements
const domElementSchema = {
  type: 'object',
  properties: {
    tag: { type: 'string' },
    text: { type: 'string' },
    label: { type: 'string' },
    children: { 
      type: 'array',
      items: { type: 'object' }
    }
  },
  required: ['tag', 'text', 'label', 'children']
};

app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url);

    const domSnapshot = await page.evaluate(() => {
      const getElementInfo = (element) => {
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent.trim(),
          children: Array.from(element.children).map(getElementInfo)
        };
      };
      return getElementInfo(document.body);
    });

    await browser.close();
    res.json({ domSnapshot });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process', async (req, res) => {
  try {
    const { domSnapshot } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a DOM processor that labels important elements with their semantic meaning.

TASK:
Analyze the provided DOM structure and label each element with its semantic purpose.

RULES:
1. Each element MUST have a 'label' field describing its semantic role
2. Labels should be specific and descriptive (e.g., 'main-navigation', 'article-content', 'product-card')
3. Maintain the exact structure of the input, only adding the 'label' field
4. Consider the element's context, content, and hierarchy when assigning labels
5. Use consistent label naming patterns throughout the tree

LABEL CATEGORIES:
- Navigation: 'main-nav', 'footer-nav', 'breadcrumb-nav'
- Content: 'main-content', 'article-body', 'product-description'
- Layout: 'header-section', 'sidebar', 'footer-section'
- Interactive: 'search-form', 'contact-form', 'newsletter-signup'
- Components: 'social-links', 'product-card', 'image-gallery'

You MUST use the provided function to return your response.`
        },
        {
          role: "user",
          content: JSON.stringify(domSnapshot)
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "processDOM",
            description: "Process and label a DOM element and its children",
            parameters: domElementSchema
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "processDOM" } },
      temperature: 0.2
    });

    let processedDOM;
    try {
      const toolCall = completion.choices[0].message.tool_calls[0];
      processedDOM = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('JSON Parse error:', parseError);
      console.log('Raw response:', completion.choices[0].message);
      throw new Error('Failed to parse the AI response as JSON');
    }

    res.json({ processedDOM });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 