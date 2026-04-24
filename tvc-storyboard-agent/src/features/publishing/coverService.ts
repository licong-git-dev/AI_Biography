import type { Character, Episode, Shot } from '../../types';
import {
  extractImageDataUrl,
  getGeminiClient,
  MODELS,
} from '../../services/geminiClient';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export type CoverAspect = '9:16' | '3:4' | '1:1';

function buildPrompt(params: {
  episode: Episode;
  coverText: string;
  platform: string;
  shots: Shot[];
  characters: Character[];
}): string {
  const { episode, coverText, platform, shots, characters } = params;

  // 找本集最"抓人"的镜头：有关键帧且描述信息最长的前 3 条
  const candidateShots = shots
    .filter((s) => s.keyframeUrl)
    .sort((a, b) => b.description.length - a.description.length)
    .slice(0, 3);

  const charBase = characters
    .filter((c) => (episode.shotIds ?? []).length > 0 || shots.some((s) => s.characters.includes(c.id)))
    .slice(0, 3)
    .map((c) => `${c.name}（${c.ageStage}）：${c.appearance.join('；')}`)
    .join('\n');

  return `为《李聪传》AI 短剧生成封面图。

【集信息】
EP${String(episode.episodeNumber).padStart(2, '0')}《${episode.title}》
主冲突：${episode.mainConflict}
记忆点：${episode.memoryPoints.join('、')}

【封面大字文案（必须清晰可读，占画面显著位置）】
${coverText}

【目标平台】
${platform}

【本集核心画面参考】
${candidateShots.map((s) => `${s.number}：${s.description}`).join('\n') || '（无已生成镜头）'}

${charBase ? `【可能出场角色外观基线】\n${charBase}` : ''}

【视觉规则】
- 封面必须"一眼抓人"，强情绪，有故事感
- 文字要放在不压人脸、对比度高的位置
- 中文文字必须清晰无错字
- 画面风格：写实电影感，暖色调或冷暖对比，1990s-2010s 中国乡镇或城市氛围
- 留白给文字，不要人脸糊成一团

输出一张封面图。`;
}

export async function generateCoverImage(params: {
  episode: Episode;
  coverText: string;
  platform: string;
  shots: Shot[];
  characters: Character[];
  aspect?: CoverAspect;
  signal?: AbortSignal;
}): Promise<string> {
  const { aspect = '3:4', signal } = params;
  const ai = getGeminiClient();
  const prompt = buildPrompt(params);

  recordCall('image');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: aspect,
          imageSize: '1K',
        },
      },
    }),
    signal
  );

  const url = extractImageDataUrl(response);
  if (!url) {
    throw new Error('Gemini 返回内容里没有图像数据，可能被安全策略拦截。');
  }
  return url;
}
