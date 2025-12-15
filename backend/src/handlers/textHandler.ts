import type { Env } from '../types/env';
import { generateAIResponse } from '../services/aiService';
import {
  ConversationHistorySchema,
  safeValidate,
  ConversationHistory,
  DOHistoryResponse,
} from '../schemas';

export interface TextHandlerResult {
  prompt: string;
  aiResponse: string;
  processingTime: number;
}

export async function handleTextQuery(
  prompt: string,
  env: Env,
  durableObject: DurableObjectStub,
): Promise<TextHandlerResult> {
  const startTime = Date.now();

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  await durableObject.fetch(
    new Request('http://do/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: prompt }),
    }),
  );

  const historyResponse = await durableObject.fetch(new Request('http://do/history'));
  const raw: unknown = await historyResponse.json();
  const doHistory: DOHistoryResponse = raw as DOHistoryResponse;
  const validation = safeValidate(ConversationHistorySchema, doHistory.data?.messages);
  const history: ConversationHistory = validation.success ? validation.data : [];

  const aiResponse = await generateAIResponse(prompt, env, history);

  await durableObject.fetch(
    new Request('http://do/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'assistant', content: aiResponse }),
    }),
  );

  const processingTime = Date.now() - startTime;

  return {
    prompt,
    aiResponse,
    processingTime,
  };
}
