import type { Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { recordCall } from '../../stores/statsStore';
import {
  useStyleBaselineStore,
  buildStyleBaselineContext,
} from '../../stores/styleBaselineStore';

/**
 * 用 Veo 3 做图生视频。参数名和 API 形状可能随 @google/genai 版本变化，
 * 如果报方法不存在，用户可根据 SDK 版本调整下面的方法路径。
 */
export async function generateShotVideo(
  shot: Shot,
  signal?: AbortSignal
): Promise<{ url: string; prompt: string }> {
  const ai = getGeminiClient();
  if (!shot.keyframeUrl) {
    throw new Error('请先生成该镜头的关键帧，再做图生视频。');
  }

  const prompt = buildVideoPrompt(shot);
  const m = shot.keyframeUrl.match(/^data:(.*?);base64,(.+)$/);
  if (!m) throw new Error('关键帧格式异常，无法作为起始帧。');
  const mimeType = m[1] ?? 'image/png';
  const imageBytes = m[2]!;

  // @ts-expect-error - generateVideos 可能不在当前 SDK 类型定义中，运行时检测
  const models = ai.models as Record<string, unknown>;
  if (typeof models.generateVideos !== 'function') {
    throw new Error(
      'SDK 版本不支持 Veo 视频生成。请升级 @google/genai 或改用其它视频生成方案。'
    );
  }

  recordCall('video');
  let operation = await ai.models.generateVideos({
    model: MODELS.VIDEO,
    prompt,
    image: { imageBytes, mimeType },
    config: {
      aspectRatio: '9:16',
      durationSeconds: Math.min(Math.max(shot.duration, 3), 8),
      numberOfVideos: 1,
    },
  });

  // 轮询操作完成
  while (!operation?.done) {
    if (signal?.aborted) throw new Error('用户中止');
    await new Promise((r) => setTimeout(r, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const generated = operation?.response?.generatedVideos?.[0];
  const videoUri = generated?.video?.uri;
  if (!videoUri) {
    throw new Error('视频生成完成但没返回 URI，检查账号配额或模型可用性。');
  }

  // 下载视频字节并转成 data URL
  const apiKey =
    (typeof window !== 'undefined' &&
      window.localStorage.getItem('gemini_api_key')) ||
    '';
  const res = await fetch(
    `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${apiKey}`
  );
  if (!res.ok) throw new Error(`下载视频失败：${res.status}`);
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  return { url: dataUrl, prompt };
}

function buildVideoPrompt(shot: Shot): string {
  const styleCtx = buildStyleBaselineContext(
    useStyleBaselineStore.getState().baseline
  );
  const styleBlock = styleCtx ? `\n${styleCtx}\n` : '';

  return `《李聪传》短剧镜头动起来。
${styleBlock}
镜头描述：${shot.description}
运镜：${shot.cameraMove ?? '固定'}
景别：${shot.shotSize}
时长：${shot.duration} 秒
情绪：写实、怀旧、有故事感
要求：
- 以传入的起始帧为第一帧
- 人物外观、服装、背景与起始帧完全一致
- 角色动作自然微小（眨眼、呼吸、轻微转头），不做夸张表演
- 环境有轻微氛围变化（光线、尘埃、风等）
- 避免镜头切换，保持单镜头连续`;
}
