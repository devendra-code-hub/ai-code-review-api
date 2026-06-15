/// <reference types="node" />
import fetch from 'node-fetch';
import { ReviewRequest, ReviewResponse } from '../types';
import { config } from '../config';

const MODELS = [
  'qwen/qwen-2.5-72b-instruct:free',
  'google/gemma-3-4b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

const buildPrompt = (code: string, language: string, context?: string) => `You are an expert code reviewer. Analyze the following ${language} code and return ONLY a valid JSON object with this exact structure:
{
  "bugs": ["list of bugs found"],
  "security": ["list of security vulnerabilities"],
  "complexity": "brief complexity analysis",
  "suggestions": ["list of improvement suggestions"],
  "score": <integer 1-10>,
  "summary": "one paragraph overall summary"
}

${context ? `Context: ${context}\n` : ''}

Code to review:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON object. No markdown, no explanation outside the JSON.`;

const callModel = async (model: string, prompt: string): Promise<ReviewResponse> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.anthropicKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-code-review-api-3.onrender.com',
      'X-Title': 'AI Code Review API',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${model} failed (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const text: string = data.choices[0].message.content;
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned) as ReviewResponse;
};

export const analyzeCode = async (request: ReviewRequest): Promise<ReviewResponse> => {
  const { code, language, context } = request;
  const prompt = buildPrompt(code, language, context);

  let lastError: Error = new Error('All models failed');

  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      const result = await callModel(model, prompt);
      console.log(`✅ Success with: ${model}`);
      return result;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      lastError = e;
    }
  }

  throw lastError;
};