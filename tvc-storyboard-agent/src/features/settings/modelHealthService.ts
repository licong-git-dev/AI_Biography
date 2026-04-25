import {
  getGeminiClient,
  MODELS,
  type ModelKind,
} from '../../services/geminiClient';
import { useModelStore } from '../../stores/modelStore';

/**
 * 探测一个模型是否对当前 API Key 可用。
 * 文本模型：发一个极小的 ping prompt
 * 图像模型：跳过实际生成（太贵），只检查模型 ID 在 list 里
 * 视频/音频：跳过（成本太高），仅在用户实际触发时探测
 */
export async function probeTextModel(kind: ModelKind): Promise<void> {
  const setHealth = useModelStore.getState().setHealth;
  setHealth(kind, { status: 'probing', lastProbedAt: Date.now() });

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: MODELS[kind],
      contents: 'ping',
      config: {
        // 探测请求尽量便宜
        maxOutputTokens: 5,
      },
    });
    if (typeof response.text === 'string') {
      setHealth(kind, { status: 'ok', lastProbedAt: Date.now() });
    } else {
      setHealth(kind, {
        status: 'fail',
        lastError: '响应中没有 text 字段',
        lastProbedAt: Date.now(),
      });
    }
  } catch (e) {
    setHealth(kind, {
      status: 'fail',
      lastError: e instanceof Error ? e.message : String(e),
      lastProbedAt: Date.now(),
    });
  }
}

/**
 * 探测主要文本模型 + 快速模型。Image/Video/TTS 不做主动 ping（成本太高），
 * 等用户触发时再标记。
 */
export async function probeKeyModels(): Promise<void> {
  // 串行避免并发把限速打满
  await probeTextModel('TEXT');
  await probeTextModel('FAST');
}

/** 把任意类调用记录为 ok / fail，由各 service 在 catch 块里调 */
export function recordModelOutcome(
  kind: ModelKind,
  success: boolean,
  error?: string
): void {
  useModelStore.getState().setHealth(kind, {
    status: success ? 'ok' : 'fail',
    lastError: success ? undefined : error,
    lastProbedAt: Date.now(),
  });
}
