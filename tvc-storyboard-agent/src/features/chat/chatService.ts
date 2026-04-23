import type { Character, Chapter, Episode, Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { SYSTEM_PROMPT_CORE } from '../../services/systemPrompt';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  character?: Character | null;
  episode?: Episode | null;
  episodeShots?: Shot[];
  chapter?: Chapter | null;
}

function buildContextBlock(ctx: ChatContext): string {
  const parts: string[] = [];

  if (ctx.character) {
    const c = ctx.character;
    parts.push(
      `【当前选中角色】
- 名称：${c.name}（${c.group}·${c.ageStage}·${c.ageRange}）
- 定位：${c.positioning}
- 气质：${c.vibe.join('、')}
- 常用服装：${c.outfits[0] ?? '—'}
- 参考图：${c.referenceImageUrl ? '已生成' : '未生成'}`
    );
  }

  if (ctx.episode) {
    const e = ctx.episode;
    parts.push(
      `【当前选中集数】
- EP${String(e.episodeNumber).padStart(2, '0')}《${e.title}》
- 来源章节：第 ${e.sourceChapters.join('、')} 章
- 主冲突：${e.mainConflict}
${e.hook ? `- 钩子：${e.hook}` : ''}
${e.climax ? `- 高潮：${e.climax}` : ''}
${e.suspense ? `- 悬念：${e.suspense}` : ''}
- 记忆点：${e.memoryPoints.join('、')}
- 平台卖点：${e.platformSellingPoint}
- 时长：${e.targetDuration} · 优先级：${e.priority} · 状态：${e.status}
- 镜头数：${ctx.episodeShots?.length ?? 0}`
    );
  }

  if (ctx.chapter) {
    const ch = ctx.chapter;
    parts.push(
      `【当前选中章节】
- 第 ${ch.number} 章《${ch.title}》（${ch.wordCount.toLocaleString()} 字）
- 章节正文节选（前 800 字）：
${ch.content.slice(0, 800)}`
    );
  }

  return parts.join('\n\n');
}

export async function* streamChatReply(params: {
  messages: ChatMessage[];
  userInput: string;
  context: ChatContext;
}): AsyncGenerator<string, void, unknown> {
  const { messages, userInput, context } = params;
  const ai = getGeminiClient();

  const history = messages.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  history.push({ role: 'user', parts: [{ text: userInput }] });

  const contextBlock = buildContextBlock(context);
  const systemInstruction =
    SYSTEM_PROMPT_CORE +
    (contextBlock
      ? `\n\n[当前会话上下文 — 用户可能正在询问这些对象]\n${contextBlock}`
      : '');

  const stream = await ai.models.generateContentStream({
    model: MODELS.TEXT,
    contents: history,
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function sendChat(params: {
  messages: ChatMessage[];
  userInput: string;
  context: ChatContext;
}): Promise<string> {
  let full = '';
  for await (const chunk of streamChatReply(params)) {
    full += chunk;
  }
  return full;
}
