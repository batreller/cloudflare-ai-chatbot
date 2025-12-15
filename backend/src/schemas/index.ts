import { z } from 'zod';

export const TextRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(10000, 'Prompt too long (max 10000 characters)')
    .trim(),
});

export const AudioRequestSchema = z.object({
  audio: z
    .instanceof(Blob)
    .refine((blob) => blob.size > 0, 'Audio file is empty')
    .refine((blob) => blob.size < 25 * 1024 * 1024, 'Audio file too large (max 25MB)')
    .refine(
      (blob) => ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'].includes(blob.type),
      'Invalid audio format (supported: webm, mp3, wav, ogg)',
    ),
});

export const ClearResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      message: z.string(),
    })
    .optional(),
  error: z.string().optional(),
  timestamp: z.string().optional(),
});

z.object({
  success: z.literal(true),
  data: z.any(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime string',
  }),
});

z.object({
  success: z.literal(false),
  error: z.string(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime string',
  }),
  code: z.number().optional(),
});

export type DOHistoryResponse = {
  data: {
    messages: Message[];
  };
};

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationHistorySchema = z.array(MessageSchema);

export type ConversationHistory = z.infer<typeof ConversationHistorySchema>;
z.object({
  response: z.string(),
  conversationHistory: ConversationHistorySchema,
});

z.object({
  text: z.string(),
  vtt: z.string().optional(),
});

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errorMessage = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');

    return { success: false, error: errorMessage };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}
