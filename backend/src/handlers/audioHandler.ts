import type { Env } from '../types/env';
import { transcribeAudio } from '../services/transcriptionService';
import { generateAIResponse } from '../services/aiService';
import {
  ConversationHistory,
  ConversationHistorySchema,
  DOHistoryResponse,
  safeValidate,
} from '../schemas';

export interface AudioHandlerResult {
  transcription: string;
  aiResponse: string;
  processingTime: number;
}

export async function handleAudioTranscription(
  audioBlob: Blob,
  env: Env,
  durableObject: DurableObjectStub,
): Promise<AudioHandlerResult> {
  const startTime = Date.now();
  const audioBuffer = await audioBlob.arrayBuffer();
  const audioArray = new Uint8Array(audioBuffer);
  const transcription = await transcribeAudio(audioArray, env);

  if (!transcription) {
    throw new Error('Transcription failed or returned empty result');
  }

  await durableObject.fetch(
    new Request('http://do/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: transcription }),
    }),
  );

  const historyResponse = await durableObject.fetch(new Request('http://do/history'));
  const raw: unknown = await historyResponse.json();
  const doHistory: DOHistoryResponse = raw as DOHistoryResponse;
  const validation = safeValidate(ConversationHistorySchema, doHistory.data?.messages);
  const history: ConversationHistory = validation.success ? validation.data : [];

  const aiResponse = await generateAIResponse(transcription, env, history);

  await durableObject.fetch(
    new Request('http://do/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'assistant', content: aiResponse }),
    }),
  );

  const processingTime = Date.now() - startTime;

  return {
    transcription,
    aiResponse,
    processingTime,
  };
}
