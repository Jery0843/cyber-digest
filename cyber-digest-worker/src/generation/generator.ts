import type { Env, CyberEvent } from '../types';
import { NEWS_PROMPT, BLOG_PROMPT, ARTICLE_PROMPT, buildSourceDataString } from './prompts';

export interface GeneratedContent {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  confidence_score: number;
}

// Ensure we use a model that supports structured JSON output and large context
const MODEL = '@cf/meta/llama-3.3-70b-instruct-awq';

export async function generateContent(env: Env, events: CyberEvent[], type: 'news' | 'blog' | 'article'): Promise<GeneratedContent | null> {
  if (!events || events.length === 0) return null;

  let systemPrompt = '';
  let maxTokens = 500;

  switch (type) {
    case 'news':
      systemPrompt = NEWS_PROMPT;
      maxTokens = 800;
      break;
    case 'blog':
      systemPrompt = BLOG_PROMPT;
      maxTokens = 1500;
      break;
    case 'article':
      systemPrompt = ARTICLE_PROMPT;
      maxTokens = 2500;
      break;
  }

  const userPrompt = buildSourceDataString(events);
  
  console.log(`Generating ${type} with ${events.length} sources using ${MODEL}`);

  // Retry logic for malformed JSON
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
        response_format: { type: "json_object" } 
      });

      console.log('Workers AI raw response type:', typeof response);
      console.log('Workers AI raw response keys:', response ? Object.keys(response) : 'null');
      console.log('Workers AI raw response:', JSON.stringify(response));

      let parsed: GeneratedContent;
      
      if (response && typeof response === 'object') {
        const aiResp = (response as any).response;
        if (aiResp && typeof aiResp === 'object') {
          parsed = aiResp;
        } else if (typeof aiResp === 'string') {
          let cleanStr = aiResp.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanStr);
        } else {
          throw new Error('Unexpected response format from Workers AI');
        }
      } else if (typeof response === 'string') {
        let cleanStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanStr);
      } else {
        throw new Error('Unexpected response format from Workers AI');
      }
      
      // Basic structural validation
      if (!parsed.title || !parsed.content || !parsed.summary || typeof parsed.confidence_score !== 'number') {
         throw new Error('JSON missing required fields');
      }

      return parsed;
    } catch (error) {
      console.error(`Generation attempt ${attempts} failed:`, error);
      if (attempts >= maxAttempts) {
        return null;
      }
    }
  }

  return null;
}
