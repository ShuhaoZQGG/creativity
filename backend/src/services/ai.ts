import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateTextParams {
  brandName: string;
  productDescription: string;
  targetAudience: string;
  tone?: string;
  numVariants?: number;
  websiteUrl?: string;
}

export interface TextVariant {
  headline: string;
  body: string;
  cta: string;
}

export async function generateAdText(params: GenerateTextParams): Promise<TextVariant[]> {
  const {
    brandName,
    productDescription,
    targetAudience,
    tone = 'friendly',
    numVariants = 3,
  } = params;

  const prompt = `You are an expert ad copywriter. Generate ${numVariants} different ad creative variants for a Meta (Facebook/Instagram) ad campaign.

Brand: ${brandName}
Product: ${productDescription}
Target Audience: ${targetAudience}
Tone: ${tone}

For each variant, provide:
1. A compelling headline (max 40 characters)
2. Primary text/body (max 125 characters)
3. A clear call-to-action (CTA)

Format your response as a JSON array with objects containing "headline", "body", and "cta" fields.
Make each variant unique and engaging, optimized for ${targetAudience}.`;

  try {
    // Use Claude for text generation
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const variants: TextVariant[] = JSON.parse(jsonMatch[0]);
    return variants.slice(0, numVariants);
  } catch (error) {
    console.error('Error generating ad text:', error);
    throw error;
  }
}

export async function generateImage(prompt: string, retries = 3): Promise<string> {
  const fullPrompt = `Professional advertising image: ${prompt}. High quality, eye-catching, suitable for social media ads.`;

  console.log('[AI] Generating image with DALL-E-3');
  console.log('[AI] Prompt:', fullPrompt.substring(0, 200) + '...');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt}/${retries}`);

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      console.log('[AI] Image generated successfully');
      console.log('[AI] Image URL:', response.data[0].url);

      return response.data[0].url!;
    } catch (error: any) {
      console.error(`[AI] Attempt ${attempt}/${retries} failed`);
      console.error('[AI] Error details:', {
        status: error.status,
        type: error.type,
        code: error.code,
        message: error.message,
        request_id: error.request_id,
      });

      // If it's a 500 error and we have retries left, wait and retry
      if (error.status === 500 && attempt < retries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s...
        console.log(`[AI] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's a content policy error, throw immediately
      if (error.status === 400 || error.type === 'invalid_request_error') {
        console.error('[AI] Content policy or invalid request error - not retrying');
        throw new Error(`Image generation failed: ${error.message}`);
      }

      // Last attempt or non-retryable error
      if (attempt === retries) {
        console.error('[AI] All retry attempts exhausted');
        throw new Error(`Failed to generate image after ${retries} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('Failed to generate image');
}

export async function generateImageVariation(
  baseImageUrl: string,
  prompt: string,
  retries = 3
): Promise<string> {
  console.log('[AI] Generating image variation');
  console.log('[AI] Base image URL:', baseImageUrl.substring(0, 100) + '...');
  console.log('[AI] Variation prompt:', prompt);

  // For now, we'll use DALL-E 3 with the prompt + description of wanting variation
  // OpenAI's variations endpoint only works with DALL-E 2 and doesn't support custom prompts
  // A better approach would be to use img2img from Stability AI, but for simplicity we'll use DALL-E 3

  const fullPrompt = `Professional advertising image variation: ${prompt}. Create a unique variant while maintaining the same brand style and composition. High quality, eye-catching, suitable for social media ads.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI] Variation attempt ${attempt}/${retries}`);

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      console.log('[AI] Image variation generated successfully');
      return response.data[0].url!;
    } catch (error: any) {
      console.error(`[AI] Variation attempt ${attempt}/${retries} failed`);
      console.error('[AI] Error details:', {
        status: error.status,
        type: error.type,
        message: error.message,
      });

      if (error.status === 500 && attempt < retries) {
        const waitTime = attempt * 2000;
        console.log(`[AI] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (error.status === 400 || error.type === 'invalid_request_error') {
        console.error('[AI] Content policy or invalid request error - not retrying');
        throw new Error(`Image variation failed: ${error.message}`);
      }

      if (attempt === retries) {
        console.error('[AI] All retry attempts exhausted');
        throw new Error(`Failed to generate image variation after ${retries} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('Failed to generate image variation');
}

export interface ScoreResult {
  overall: number;
  clarity: number;
  engagement: number;
  cta: number;
  reasoning: string;
}

export async function scoreAdCreative(
  headline: string,
  body: string,
  cta: string
): Promise<ScoreResult> {
  const prompt = `You are an expert ad performance analyst. Score this ad creative on a scale of 0 to 1:

Headline: ${headline}
Body: ${body}
CTA: ${cta}

Provide scores for:
1. overall: Overall effectiveness (0-1)
2. clarity: Message clarity (0-1)
3. engagement: Potential engagement (0-1)
4. cta: Call-to-action strength (0-1)
5. reasoning: Brief explanation of the scores

Format as JSON: {"overall": 0.85, "clarity": 0.9, "engagement": 0.8, "cta": 0.85, "reasoning": "explanation"}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const score: ScoreResult = JSON.parse(jsonMatch[0]);
    return score;
  } catch (error) {
    console.error('Error scoring ad creative:', error);
    throw error;
  }
}
