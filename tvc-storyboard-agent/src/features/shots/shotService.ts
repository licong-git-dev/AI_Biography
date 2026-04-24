import type { Character, Shot } from '../../types';
import {
  extractImageDataUrl,
  getGeminiClient,
  MODELS,
} from '../../services/geminiClient';

function buildShotPrompt(shot: Shot, characters: Character[]): string {
  const baselines = characters
    .filter((c) => shot.characters.includes(c.id))
    .map(
      (c) => `- ${c.name}（${c.ageStage}·${c.ageRange}）
  外观：${c.appearance.join('；')}
  气质：${c.vibe.join('、')}
  典型服装：${c.outfits[0] ?? '—'}
  英文基线：${c.promptBaseline}`
    )
    .join('\n');

  return `为《李聪传》AI 短剧生成单个镜头的关键帧。

【镜头信息】
- 编号：${shot.number}
- 景别：${shot.shotSize}
- 运镜：${shot.cameraMove ?? '固定'}
- 时长：${shot.duration} 秒
- 画面描述：${shot.description}
- 旁白：${shot.narration ?? '（无）'}
- 对白：${shot.dialogue ?? '（无）'}
- 声音氛围：${shot.audioNotes}

【出场角色及外观基线（严格遵循，不得偷懒简写）】
${baselines || '（本镜头无角色出场，以环境/道具为主）'}

【视觉规则】
- 9:16 竖屏构图（适配抖音 / 视频号 / 小红书 / B站竖屏）
- 写实电影感，自然光或柔和棚灯
- 时代背景：1990s-2010s 中国乡村 / 小城家庭环境
- 情绪基调：怀旧、朴实、真实、有故事感，不要美型化
- 色调：温暖偏黄褐或冷淡蓝绿，视镜头情绪定
- 如有参考图（上方 inline），角色外观必须与参考图完全一致

【构图指引】
- 景别「${shot.shotSize}」对应的画面范围
- 运镜提示：${shot.cameraMove ?? '静态构图'}
- 中心主体：${shot.description.slice(0, 60)}

输出：该镜头的单帧关键帧静图（不是视频，不是组图）。`;
}

type InlinePart = { inlineData: { mimeType: string; data: string } };
type TextPart = { text: string };
type Part = InlinePart | TextPart;

function extractInlineParts(refImageUrls: string[]): InlinePart[] {
  return refImageUrls
    .map((url): InlinePart | null => {
      const m = url.match(/^data:(.*?);base64,(.+)$/);
      if (!m || !m[2]) return null;
      return { inlineData: { mimeType: m[1] ?? 'image/png', data: m[2] } };
    })
    .filter((v): v is InlinePart => v !== null);
}

export async function generateShotKeyframe(
  shot: Shot,
  characters: Character[]
): Promise<{ url: string; prompt: string }> {
  const ai = getGeminiClient();
  // 用户手动编辑过的 prompt 优先；否则根据当前字段自动拼
  const prompt = shot.prompt && shot.prompt.trim()
    ? shot.prompt
    : buildShotPrompt(shot, characters);

  const refImageUrls = characters
    .filter((c) => shot.characters.includes(c.id))
    .map((c) => c.referenceImageUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0);

  const parts: Part[] = [
    ...extractInlineParts(refImageUrls),
    { text: prompt },
  ];

  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: [{ role: 'user', parts }],
    config: {
      imageConfig: {
        aspectRatio: '9:16',
        imageSize: '1K',
      },
    },
  });

  const url = extractImageDataUrl(response);
  if (!url) {
    throw new Error('Gemini 返回内容里没有图像数据，可能被安全策略拦截或模型暂不可用。');
  }
  return { url, prompt };
}

export class BatchAbortError extends Error {
  constructor() {
    super('用户中止了批量生成。');
    this.name = 'BatchAbortError';
  }
}

/**
 * 顺序生成本集全部镜头关键帧。支持 AbortSignal 中止（只在每个 shot 边界生效，
 * 不会撕断正在进行的单帧请求）。
 */
export async function generateKeyframesForShots(params: {
  shots: Shot[];
  characters: Character[];
  onStart: (shotId: string) => void;
  onSuccess: (shotId: string, url: string, prompt: string) => void;
  onFailure: (shotId: string, error: string) => void;
  signal?: AbortSignal;
}): Promise<{ successCount: number; failCount: number; aborted: boolean }> {
  const { shots, characters, onStart, onSuccess, onFailure, signal } = params;
  let successCount = 0;
  let failCount = 0;

  for (const shot of shots) {
    if (signal?.aborted) {
      return { successCount, failCount, aborted: true };
    }
    onStart(shot.id);
    try {
      const { url, prompt } = await generateShotKeyframe(shot, characters);
      onSuccess(shot.id, url, prompt);
      successCount++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      onFailure(shot.id, msg);
      failCount++;
    }
  }

  return { successCount, failCount, aborted: false };
}
