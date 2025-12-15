import type { Env } from '../types/env';

export async function transcribeAudio(audioData: Uint8Array, env: Env): Promise<string> {
  try {
    if (!audioData || audioData.length === 0) {
      throw new Error('Audio data is empty');
    }

    const response = await env.AI.run('@cf/openai/whisper', {
      audio: Array.from(audioData),
    });

    if (response && typeof response === 'object' && 'text' in response) {
      return (response as { text: string }).text;
    }

    throw new Error('Invalid transcription response format');
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
