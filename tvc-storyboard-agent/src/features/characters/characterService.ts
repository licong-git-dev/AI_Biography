import type { Character } from '../../types';
import { extractImageDataUrl, getGeminiClient, MODELS } from '../../services/geminiClient';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

function buildReferencePrompt(character: Character): string {
  const appearanceBlock = character.appearance.map((a) => `- ${a}`).join('\n');
  const outfitsBlock = character.outfits.map((o) => `- ${o}`).join('\n');
  const vibeLine = character.vibe.join('、');

  return `为《李聪传》AI 短剧生成角色一致性参考图（Character Reference Sheet）。

角色名称：${character.name}（${character.ageStage} · ${character.ageRange}）

外观基线（必须严格遵循，不得偷懒简写）：
${appearanceBlock}

气质关键词：${vibeLine}

常用服装组（选其中最典型的一套呈现）：
${outfitsBlock}

英文画面提示词基线（可用于增强识别）：
${character.promptBaseline}

【画面布局要求】
- 2×3 宫格，共 6 个视图
- 布局：正面半身 | 正面全身 | 左侧 45 度半身 / 左侧全身 | 背面全身 | 右侧 45 度全身
- 整体比例约 2.5:1，宽长方形，填满画布，不留黑边
- 每个视图之间用细线或淡灰色分隔
- 背景统一为浅灰色摄影棚

【硬性要求】
1. 面部特征、身形比例、肤色、发型在 6 个视图中必须完全一致
2. 服装必须是常用服装组中的一套（6 个视图服装一致）
3. 不要文字、标注、logo、水印
4. 自然光或柔和棚灯，写实电影感
5. 年龄必须严格匹配（${character.ageRange}）
6. 情绪基调遵循气质关键词：${vibeLine}

输出一张完整的 Reference Sheet 图片。`;
}

export async function generateCharacterReference(
  character: Character,
  signal?: AbortSignal
): Promise<string> {
  const ai = getGeminiClient();
  const prompt = buildReferencePrompt(character);

  recordCall('image');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: '21:9',
          imageSize: '1K',
        },
      },
    }),
    signal
  );

  const url = extractImageDataUrl(response);
  if (!url) {
    throw new Error('Gemini 返回内容里没有图像数据，可能被安全策略拦截或模型暂不可用。');
  }
  return url;
}
