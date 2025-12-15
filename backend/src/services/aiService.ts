import type { Env } from '../types/env';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_CONFIG: AIConfig = {
  model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  maxTokens: 1024,
  temperature: 0.7,
};

export async function generateAIResponse(
  prompt: string,
  env: Env,
  history: Message[] = [],
  config: Partial<AIConfig> = {},
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const messages: Array<{ role: string; content: string }> = [];

    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await env.AI.run(finalConfig.model as any, {
      messages: messages,
      max_tokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
    });

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      if ('response' in response && typeof response.response === 'string') {
        return response.response;
      }
      if ('text' in response && typeof response.text === 'string') {
        return response.text;
      }
    }

    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
