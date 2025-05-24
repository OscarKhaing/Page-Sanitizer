import OpenAI from 'openai';
import puppeteer from 'puppeteer';

// Types
export interface DOMElement {
  tag: string;
  text: string;
  id?: string;
  xpath?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LabeledDOMElement extends DOMElement {
  intent: string;
  important: boolean;
}

export class DOMProcessor {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async scrapePage(url: string): Promise<DOMElement[]> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const elements = await page.evaluate(() => {
      function getXPath(element: Element): string {
        if (element.id) return `//*[@id="${element.id}"]`;
        
        const path: string[] = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
          let selector = element.nodeName.toLowerCase();
          let sibling = element.previousSibling;
          let siblingCount = 1;
          
          while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && 
                sibling.nodeName === element.nodeName) {
              siblingCount++;
            }
            sibling = sibling.previousSibling;
          }
          
          if (siblingCount > 1) selector += `[${siblingCount}]`;
          path.unshift(selector);
          element = element.parentNode as Element;
        }
        
        return `/${path.join('/')}`;
      }

      return Array.from(document.querySelectorAll('*')).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent || '',
        id: el.id,
        xpath: getXPath(el),
        boundingBox: el.getBoundingClientRect().toJSON()
      }));
    });

    await browser.close();
    return elements;
  }

  private async labelDOM(domSnapshot: DOMElement[]): Promise<LabeledDOMElement[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a UI labeling agent. Your task is to infer the user's intent for each element and tag it with 'intent' and 'important' fields."
          },
          {
            role: "user",
            content: `Add intent and important fields to these DOM elements:\n${JSON.stringify(domSnapshot, null, 2)}`
          }
        ],
        temperature: 0.3
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      return JSON.parse(content) as LabeledDOMElement[];
    } catch (error) {
      console.error('Error labeling DOM:', error);
      throw error;
    }
  }

  private simplifyDOM(labeled: LabeledDOMElement[]): LabeledDOMElement[] {
    return labeled.filter(el => el.important);
  }

  async processPage(url: string): Promise<LabeledDOMElement[]> {
    // 1. Scrape
    const domSnapshot = await this.scrapePage(url);
    
    // 2. Label with LLM
    const labeledDOM = await this.labelDOM(domSnapshot);
    
    // 3. Simplify (remove unimportant elements)
    const simplified = this.simplifyDOM(labeledDOM);
    
    return simplified;
  }
} 