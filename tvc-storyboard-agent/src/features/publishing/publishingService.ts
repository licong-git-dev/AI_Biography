import type { Episode, PublishingPack, PlatformCopy } from '../../types';
import { PLATFORMS } from '../../types';
import {
  getGeminiClient,
  MODELS,
  thinkingConfigIfEnabled,
} from '../../services/geminiClient';
import { SYSTEM_PROMPT_CORE } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { recordCall } from '../../stores/statsStore';
import { validatePublishingPlatforms } from '../../services/validate';
import { buildBestPracticesContext } from '../../data/bestPractices';

const PLATFORM_RULES = `
【各平台文案风格】
- 抖音：标题极具钩子感，15 字内制造好奇；用 3-5 个 # 标签；简介 1-2 句话点燃情绪
- 视频号：标题偏情感向 / 共鸣向；简介 2-3 句，适合家庭用户；标签 3-4 个
- 小红书：标题可用 emoji，强种草感；简介分段，有金句；标签 5-8 个话题标签
- B站：标题可更长一些，允许小标题 + 冒号结构；简介可详细一点，面向年轻核心受众；标签 3-5 个
`;

function buildPrompt(episode: Episode): string {
  const best = buildBestPracticesContext('publishing');
  return `${best}

为下面这一集生成**所有 4 个平台**的发布文案包。

【集信息】
EP${String(episode.episodeNumber).padStart(2, '0')}《${episode.title}》
- 主冲突：${episode.mainConflict}
${episode.hook ? `- 钩子：${episode.hook}` : ''}
${episode.climax ? `- 高潮：${episode.climax}` : ''}
${episode.suspense ? `- 悬念：${episode.suspense}` : ''}
- 记忆点：${episode.memoryPoints.join('、')}
- 平台卖点：${episode.platformSellingPoint}
- 时长：${episode.targetDuration}
- 格式：${episode.format}
${PLATFORM_RULES}

【输出要求 - 严格 JSON】
{
  "platforms": [
    {
      "platform": "抖音 | 视频号 | 小红书 | B站",
      "title": "平台标题",
      "description": "平台简介（多行用 \\n）",
      "tags": ["标签1", "标签2", "..."],
      "coverText": "封面 1-2 行大字文案",
      "pinnedComment": "置顶评论（可选，引发互动）"
    }
  ]
}

【硬性要求】
1. platforms 数组必须包含 4 个平台：${PLATFORMS.join(' / ')}
2. 每个平台的文案必须符合上面的风格规则，不能套一份文案通用
3. 标题不要剧透高潮，留悬念
4. 封面文案最多 12 字，要能单独成立

只返回 JSON，不要 markdown 代码块或解释。`;
}

export async function generatePublishingPack(
  episode: Episode
): Promise<PublishingPack> {
  const ai = getGeminiClient();
  recordCall('text');
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: buildPrompt(episode),
    config: {
      systemInstruction: SYSTEM_PROMPT_CORE,
      responseMimeType: 'application/json',
      ...thinkingConfigIfEnabled(),
    },
  });

  const text = response.text ?? '';
  if (!text) throw new Error('Gemini 返回为空。');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const platforms = validatePublishingPlatforms(parsed);

  return {
    episodeId: episode.id,
    generatedAt: Date.now(),
    platforms,
  };
}
