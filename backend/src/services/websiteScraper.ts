import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import Vibrant from 'node-vibrant';
import { uploadImage } from './storage.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WebsiteAnalysis {
  url: string;
  brandColors: string[];
  brandFonts: string[];
  styleKeywords: string[];
  tone: string;
  screenshotUrl: string;
  textContent: string;
  description: string;
}

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('[WebScraper] Launching browser...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    console.log('[WebScraper] Browser launched successfully');
  }
  return browserInstance;
}

export async function analyzeWebsite(websiteUrl: string, userId: string): Promise<WebsiteAnalysis> {
  console.log('[WebScraper] Starting website analysis for:', websiteUrl);

  let browser: Browser | null = null;

  try {
    // Validate and normalize URL
    const url = new URL(websiteUrl);
    const normalizedUrl = url.toString();

    // Launch browser and create page
    browser = await getBrowser();
    const page = await browser.newPage();

    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1280, height: 800 });

    console.log('[WebScraper] Navigating to URL...');
    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    console.log('[WebScraper] Page loaded successfully');

    // Capture screenshot
    console.log('[WebScraper] Capturing screenshot...');
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'png',
    });

    // Upload screenshot to S3
    console.log('[WebScraper] Uploading screenshot to S3...');
    const screenshotS3Key = await uploadImage(screenshotBuffer as Buffer, userId, 'image/png');
    console.log('[WebScraper] Screenshot uploaded:', screenshotS3Key);

    // Get page HTML
    const html = await page.content();

    // Extract colors from screenshot using Vibrant
    console.log('[WebScraper] Extracting colors...');
    const palette = await Vibrant.from(screenshotBuffer as Buffer).getPalette();
    const brandColors = [
      palette.Vibrant?.hex,
      palette.DarkVibrant?.hex,
      palette.LightVibrant?.hex,
      palette.Muted?.hex,
      palette.DarkMuted?.hex,
    ].filter(Boolean) as string[];
    console.log('[WebScraper] Colors extracted:', brandColors);

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract text content (limit to first 3000 chars)
    $('script, style, noscript').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

    // Extract fonts from CSS
    const fontFamilies = new Set<string>();
    $('*').each((_, el) => {
      const fontFamily = $(el).css('font-family');
      if (fontFamily) {
        fontFamily.split(',').forEach(font => {
          const cleanFont = font.trim().replace(/['"]/g, '');
          if (cleanFont && !cleanFont.includes('system-ui') && !cleanFont.includes('sans-serif')) {
            fontFamilies.add(cleanFont);
          }
        });
      }
    });
    const brandFonts = Array.from(fontFamilies).slice(0, 5);

    // Get meta description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    await page.close();

    // Analyze visual style using GPT-4 Vision
    console.log('[WebScraper] Analyzing visual style with AI...');
    const styleAnalysis = await analyzeVisualStyle(screenshotS3Key, textContent, brandColors);

    console.log('[WebScraper] Analysis complete!');

    return {
      url: normalizedUrl,
      brandColors,
      brandFonts,
      styleKeywords: styleAnalysis.styleKeywords,
      tone: styleAnalysis.tone,
      screenshotUrl: screenshotS3Key,
      textContent,
      description,
    };
  } catch (error) {
    console.error('[WebScraper] Error analyzing website:', error);
    throw error;
  }
}

async function analyzeVisualStyle(
  screenshotS3Key: string,
  textContent: string,
  colors: string[]
): Promise<{ styleKeywords: string[]; tone: string }> {
  try {
    // Note: GPT-4 Vision requires the actual image URL, not S3 key
    // For now, we'll analyze based on colors and text content
    // In production, you'd generate a public URL for the screenshot

    const prompt = `Analyze this website based on the following information:

Colors used: ${colors.join(', ')}
Website text sample: "${textContent.substring(0, 500)}"

Provide a JSON response with:
1. styleKeywords: Array of 5 keywords describing the visual style (e.g., "modern", "minimalist", "playful", "professional", "bold", "elegant")
2. tone: The brand's communication tone (e.g., "friendly", "professional", "playful", "urgent", "luxurious")

Format: {"styleKeywords": ["keyword1", "keyword2", ...], "tone": "tone_description"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.log('[WebScraper] Could not parse AI response, using defaults');
      return {
        styleKeywords: ['modern', 'professional', 'clean'],
        tone: 'professional',
      };
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return {
      styleKeywords: analysis.styleKeywords || ['modern', 'professional', 'clean'],
      tone: analysis.tone || 'professional',
    };
  } catch (error) {
    console.error('[WebScraper] Error analyzing visual style:', error);
    // Return defaults on error
    return {
      styleKeywords: ['modern', 'professional', 'clean'],
      tone: 'professional',
    };
  }
}

// Cleanup function to close browser
export async function closeBrowser() {
  if (browserInstance) {
    console.log('[WebScraper] Closing browser...');
    await browserInstance.close();
    browserInstance = null;
  }
}
