import { handleAudioTranscription } from './handlers/audioHandler';
import { handleTextQuery } from './handlers/textHandler';
import { ConversationMemory } from './memory/conversationMemory';
import { createAuthToken, verifyAuthToken } from './services/authService';
import type { Env } from './types/env';
import {
  TextRequestSchema,
  AudioRequestSchema,
  DOHistoryResponse,
  ConversationHistorySchema,
  ConversationHistory,
  ClearResponseSchema,
  safeValidate,
} from './schemas';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: CORS_HEADERS,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      const url = new URL(request.url);

      // POST /api/auth
      if (url.pathname === '/api/auth' && request.method === 'POST') {
        const sessionId = crypto.randomUUID();
        const token = await createAuthToken(sessionId, env);

        return jsonResponse({
          success: true,
          data: {
            token,
            expiresIn: 3600 * 24 * 30,
          },
          timestamp: new Date().toISOString(),
        });
      }

      const authResult = await verifyAuthToken(request, env);
      if (!authResult.success) {
        return jsonResponse(
          {
            success: false,
            error: authResult.error || 'Unauthorized',
            timestamp: new Date().toISOString(),
          },
          401,
        );
      }

      const sessionId = authResult.sessionId!;

      const durableObjectId = env.CONVERSATION_MEMORY.idFromName(sessionId);
      const durableObject = env.CONVERSATION_MEMORY.get(durableObjectId);

      // POST /api/text
      if (url.pathname === '/api/text' && request.method === 'POST') {
        try {
          const body = await request.json();
          const validation = safeValidate(TextRequestSchema, body);

          if (!validation.success) {
            return jsonResponse(
              {
                success: false,
                error: validation.error,
                timestamp: new Date().toISOString(),
              },
              400,
            );
          }

          const { prompt } = validation.data;
          const result = await handleTextQuery(prompt, env, durableObject);

          return jsonResponse({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return jsonResponse(
            {
              success: false,
              error: 'Invalid JSON format',
              timestamp: new Date().toISOString(),
            },
            400,
          );
        }
      }

      // POST /api/voice
      if (url.pathname === '/api/voice' && request.method === 'POST') {
        try {
          const formData = await request.formData();
          const audio = formData.get('audio');

          if (!audio || !(audio instanceof File)) {
            return jsonResponse(
              {
                success: false,
                error: 'Audio file is required',
                timestamp: new Date().toISOString(),
              },
              400,
            );
          }

          const audioBlob = new Blob([await audio.arrayBuffer()], { type: audio.type });
          const validation = safeValidate(AudioRequestSchema, { audio: audioBlob });

          if (!validation.success) {
            return jsonResponse(
              {
                success: false,
                error: validation.error,
                timestamp: new Date().toISOString(),
              },
              400,
            );
          }

          const { audio: validatedAudio } = validation.data;
          const result = await handleAudioTranscription(validatedAudio, env, durableObject);

          return jsonResponse({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return jsonResponse(
            {
              success: false,
              error: 'Failed to process audio',
              timestamp: new Date().toISOString(),
            },
            400,
          );
        }
      }

      // GET /api/history
      if (url.pathname === '/api/history' && request.method === 'GET') {
        const historyResponse = await durableObject.fetch(new Request('http://do/history'));
        const raw: unknown = await historyResponse.json();
        const doHistory: DOHistoryResponse = raw as DOHistoryResponse;
        const validation = safeValidate(ConversationHistorySchema, doHistory.data?.messages);
        const history: ConversationHistory = validation.success ? validation.data : [];

        return jsonResponse({
          success: true,
          data: { history },
          timestamp: new Date().toISOString(),
        });
      }

      // DELETE /api/clear
      if (url.pathname === '/api/clear' && request.method === 'DELETE') {
        const response = await durableObject.fetch(
          new Request('http://do/clear', { method: 'DELETE' }),
        );

        const data: unknown = await response.json();
        const validation = safeValidate(ClearResponseSchema, data);

        if (!validation.success) {
          console.error('Clear validation failed:', validation.error);
          return jsonResponse(
            {
              success: false,
              error: `Invalid response from session storage: ${validation.error}`,
              timestamp: new Date().toISOString(),
            },
            500,
          );
        }

        return jsonResponse({
          success: true,
          data: {
            message: validation.data.data?.message || 'Session cleared',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return jsonResponse(
        {
          success: false,
          error: 'Route not found',
          timestamp: new Date().toISOString(),
        },
        404,
      );
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  },
} satisfies ExportedHandler<Env>;

export { ConversationMemory };
