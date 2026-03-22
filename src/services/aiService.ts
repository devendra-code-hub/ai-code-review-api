import { ReviewRequest, ReviewResponse } from '../types';
import { config } from '../config';

export const analyzeCode = async (
  request: ReviewRequest
): Promise<ReviewResponse> => {
  const { code, language, context } = request;

  const prompt = `You are an expert code reviewer. Analyze the following ${language} code and return ONLY a valid JSON object with this exact structure:
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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.anthropicKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Code Review API',
    },
    body: JSON.stringify({
      model: 'google/gemma-3-4b-it:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${err}`);
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