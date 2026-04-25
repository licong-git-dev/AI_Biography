import { GoogleGenAI } from '@google/genai';
import { getApiKey } from './apiKey';

export type ModelKind = 'TEXT' | 'FAST' | 'VISION' | 'IMAGE' | 'VIDEO' | 'TTS' | 'STT';

/**
 * 默认模型 ID 表。已切到通用账号大概率开通的 stable 别名。
 * 用户可在 Header ⚙ 模型设置里改成自己账号有权限的 ID。
 *
 * 验证基线：gemini-flash-latest 通过 v1beta generateContent 直连可用。
 */
export const DEFAULT_MODELS: Record<ModelKind, string> = {
  TEXT: 'gemini-flash-latest', // 主结构化任务（拆集 / 镜头表 / 文案）
  FAST: 'gemini-flash-latest', // 快速任务备用
  VISION: 'gemini-flash-latest', // 多模态视觉理解
  IMAGE: 'gemini-2.5-flash-image-preview', // 标准 Nano Banana（如开通了 Pro 改成 gemini-3-pro-image-preview）
  VIDEO: 'veo-3.0-generate-preview', // Veo 3 普通账号大概率没开通，需要去 Cloud 申请
  TTS: 'gemini-2.5-flash-preview-tts',
  STT: 'gemini-flash-latest',
};

/**
 * 当前用户配置的模型 ID。每次访问都从 modelStore 读，没配置时落到默认。
 * Proxy 让代码以 MODELS.TEXT 形式访问，运行时返回最新值。
 */
export const MODELS = new Proxy(DEFAULT_MODELS, {
  get(target, prop: string) {
    if (typeof prop !== 'string' || !(prop in target)) return undefined;
    try {
      const { useModelStore } = require('../stores/modelStore') as typeof import('../stores/modelStore');
      const override = useModelStore.getState().overrides[prop as ModelKind];
      if (override && override.length > 0) return override;
    } catch {
      // store 未初始化（首次加载或测试）→ 走默认
    }
    return target[prop as ModelKind];
  },
}) as Record<ModelKind, string>;

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

/**
 * 如果用户在 UI 里打开了「深度思考」，返回可合并进 config 的 thinking 配置对象；
 * 否则返回空对象。调用方：
 *   config: { ...baseConfig, ...thinkingConfigIfEnabled() }
 * SDK 版本若不支持 thinkingConfig 字段，运行时 Gemini 会忽略未知字段，不崩。
 */
export function thinkingConfigIfEnabled(): Record<string, unknown> {
  try {
    // 延迟 require 避免循环依赖
    const { useUIStore } = require('../stores/uiStore') as typeof import('../stores/uiStore');
    const on = useUIStore.getState().thinkingMode;
    if (!on) return {};
    return {
      thinkingConfig: {
        thinkingBudget: -1, // -1 = 模型自定，正数 = 预算 token 数
      },
    };
  } catch {
    return {};
  }
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
