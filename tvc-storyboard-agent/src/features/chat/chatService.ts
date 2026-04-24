import type { Character, Chapter, Episode, Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { SYSTEM_PROMPT_CORE } from '../../services/systemPrompt';
import { recordCall } from '../../stores/statsStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** 用户在这条消息里附带的关键帧 data URL（仅 user role） */
  attachmentUrls?: string[];
  /** 附件对应的镜号，便于 UI 显示 */
  attachmentLabels?: string[];
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

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function dataUrlToInlinePart(url: string): Part | null {
  const m = url.match(/^data:(.*?);base64,(.+)$/);
  if (!m || !m[2]) return null;
  return { inlineData: { mimeType: m[1] ?? 'image/png', data: m[2] } };
}

export async function* streamChatReply(params: {
  messages: ChatMessage[];
  userInput: string;
  context: ChatContext;
  attachmentDataUrls?: string[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const {
    messages,
    userInput,
    context,
    attachmentDataUrls = [],
    signal,
  } = params;
  const ai = getGeminiClient();

  const history: Array<{ role: 'user' | 'model'; parts: Part[] }> =
    messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const lastParts: Part[] = [];
  for (const url of attachmentDataUrls) {
    const part = dataUrlToInlinePart(url);
    if (part) lastParts.push(part);
  }
  lastParts.push({ text: userInput });
  history.push({ role: 'user', parts: lastParts });

  const contextBlock = buildContextBlock(context);
  const systemInstruction =
    SYSTEM_PROMPT_CORE +
    (contextBlock
      ? `\n\n[当前会话上下文 — 用户可能正在询问这些对象]\n${contextBlock}`
      : '');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  recordCall('chat-stream');
  const stream = await ai.models.generateContentStream({
    model: MODELS.TEXT,
    contents: history,
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of stream) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
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
