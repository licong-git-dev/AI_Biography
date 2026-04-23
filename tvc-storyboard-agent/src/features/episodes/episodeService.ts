import type {
  Character,
  Episode,
  ShotSize,
  CameraMove,
  GenMethod,
} from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';

export interface GeneratedShot {
  number: string;
  duration: number;
  shotSize: ShotSize;
  description: string;
  narration?: string;
  dialogue?: string;
  characters: string[];
  audioNotes: string;
  genMethod: GenMethod;
  cameraMove?: CameraMove;
}

const TASK_RULES = `你现在的工作是"集数 → 镜头表"——根据一集短剧的信息，拆出可直接用于 AI 生成的镜头表。

额外规则：
- 6-10 个镜头撑起 60-90 秒
- 第一个镜头必须在 3 秒内抓住观众（钩子画面）
- 景别、运镜要有变化，避免单调
- 普通镜头以"关键帧 + 镜头运动"为主；关键情绪镜头升级为"图生视频"或"特写"
- 画面描述要具体可视化，包含场景、动作、视觉元素
- 角色 ID 必须严格从给定列表里选，不要自造`;

const SHOT_SIZE_ENUM = [
  '特写',
  '近景',
  '中景',
  '中近景',
  '全景',
  '远景',
  '大远景',
  '蒙太奇',
  '黑场/特写',
];

const CAMERA_MOVE_ENUM = ['推', '拉', '摇', '移', '跟', '升降', '固定', '后拉'];

const GEN_METHOD_ENUM = [
  '关键帧',
  '关键帧 + 缓推',
  '关键帧 + 微动效',
  '图生视频',
  '图生视频/航拍感',
  '图生视频/后拉',
  '静图组接',
  '静图组接 + 窗外运动',
  '特写图生视频 + 静图',
  'Remotion 字幕卡点',
];

function buildPrompt(
  episode: Episode,
  characters: Character[],
  chapterExcerpt: string | null,
  targetCount: number
): string {
  const characterList = characters
    .map(
      (c) =>
        `- ${c.id} · ${c.name}（${c.ageStage}·${c.ageRange}）气质：${c.vibe.join('、')}`
    )
    .join('\n');

  const excerptBlock = chapterExcerpt
    ? `\n【原章节节选（供参考）】\n${chapterExcerpt.slice(0, 3000)}\n`
    : '';

  return `为下面这一集拆出镜头表。

【集信息】
- 标题：《${episode.title}》
- 主冲突：${episode.mainConflict}
- 钩子：${episode.hook ?? '（未指定，请你设计一个）'}
- 高潮：${episode.climax ?? '（未指定）'}
- 悬念：${episode.suspense ?? '（未指定）'}
- 记忆点：${episode.memoryPoints.join('、')}
- 平台卖点：${episode.platformSellingPoint}
- 目标时长：${episode.targetDuration}
${excerptBlock}
【可用角色列表（必须用这里的 id，不要自造）】
${characterList}

【输出要求】
生成 ${targetCount} 个镜头（±1 可）。第一个必须是钩子镜头。

【严格枚举值】
- shotSize 必须是：${SHOT_SIZE_ENUM.join(' | ')}
- cameraMove 必须是（可选）：${CAMERA_MOVE_ENUM.join(' | ')}
- genMethod 必须是：${GEN_METHOD_ENUM.join(' | ')}
- characters 必须是上面角色列表里的 id，数组形式；无人出场则用空数组 []

【JSON 格式】
{
  "shots": [
    {
      "number": "镜号，如 '01' 或 'A-01'",
      "duration": 秒数整数,
      "shotSize": "景别",
      "description": "画面描述（具体、可视化）",
      "narration": "旁白（可选）",
      "dialogue": "对白（可选）",
      "characters": ["角色id1", "角色id2"],
      "audioNotes": "声音描述",
      "genMethod": "生成方式",
      "cameraMove": "运镜（可选）"
    }
  ]
}

只返回 JSON，不要解释或 markdown 代码块。`;
}

export async function generateShotsForEpisode(params: {
  episode: Episode;
  characters: Character[];
  chapterExcerpt?: string | null;
  targetCount?: number;
}): Promise<GeneratedShot[]> {
  const { episode, characters, chapterExcerpt = null, targetCount = 8 } = params;
  const ai = getGeminiClient();
  const prompt = buildPrompt(episode, characters, chapterExcerpt, targetCount);

  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: prompt,
    config: {
      systemInstruction: composeSystemPrompt(TASK_RULES),
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '';
  if (!text) throw new Error('Gemini 返回为空，可能被安全策略拦截。');

  let parsed: { shots?: GeneratedShot[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析 Gemini 返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const shots = parsed.shots;
  if (!Array.isArray(shots) || shots.length === 0) {
    throw new Error('返回里没有 shots 数组。');
  }

  return shots;
}
