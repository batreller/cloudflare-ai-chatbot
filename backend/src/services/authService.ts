import jwt from '@tsndr/cloudflare-worker-jwt';
import type { Env } from '../types/env';
import { AuthTokenPayload } from '../types/auth';

export async function createAuthToken(sessionId: string, env: Env): Promise<string> {
  return await jwt.sign(
    {
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    },
    env.JWT_SECRET,
  );
}

export async function verifyAuthToken(
  request: Request,
  env: Env,
): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7);

  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET);

    if (!isValid) {
      return { success: false, error: 'Invalid token' };
    }

    const decoded = jwt.decode(token);
    const payload = decoded.payload as Partial<AuthTokenPayload>;
    if (!payload.sessionId) {
      return { success: false, error: 'Invalid token payload' };
    }
    return { success: true, sessionId: payload.sessionId };
  } catch (error) {
    return { success: false, error: 'Token verification failed' };
  }
}
