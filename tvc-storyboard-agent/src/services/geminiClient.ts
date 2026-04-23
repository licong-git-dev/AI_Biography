import { GoogleGenAI } from '@google/genai';
import { getApiKey } from './apiKey';

export const MODELS = {
  TEXT: 'gemini-3-pro-preview',
  FAST: 'gemini-3-flash-preview',
  VISION: 'gemini-3-pro-preview',
  IMAGE: 'gemini-3-pro-image-preview', // Nano Banana Pro
} as const;

export class ApiKeyMissingError extends Error {
  constructor() {
    super('API Key 未配置，请在右上角点击「配置 API Key」。');
    this.name = 'ApiKeyMissingError';
  }
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) throw new ApiKeyMissingError();
  return new GoogleGenAI({ apiKey });
}

export function extractImageDataUrl(response: unknown): string | null {
  const r = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
        }>;
      };
    }>;
  };
  const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  const inline = part?.inlineData;
  if (!inline?.data) return null;
  const mime = inline.mimeType ?? 'image/png';
  return `data:${mime};base64,${inline.data}`;
}
