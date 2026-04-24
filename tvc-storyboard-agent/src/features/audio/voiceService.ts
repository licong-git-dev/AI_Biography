import type { Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

/**
 * Gemini TTS：把文本转成 base64 音频 data URL。
 * @param text 要合成的文本（中文）
 * @param speaker 可选 voice name（如 'Kore' / 'Puck' / 'Charon' 等）
 */
export async function generateSpeech(
  text: string,
  speaker: string = 'Kore',
  signal?: AbortSignal
): Promise<string> {
  if (!text.trim()) throw new Error('待合成的文本为空。');
  const ai = getGeminiClient();

  recordCall('tts');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        // @ts-expect-error - responseModalities / speechConfig 可能未在 SDK 类型里
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: speaker },
          },
        },
      } as Record<string, unknown>,
    }),
    signal
  );

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
  if (!inline?.data) {
    throw new Error(
      'TTS 模型没返回音频数据。可能是配额或模型名称需调整（当前 gemini-2.5-flash-preview-tts）。'
    );
  }
  const mime = inline.mimeType ?? 'audio/wav';
  return `data:${mime};base64,${inline.data}`;
}

/**
 * 从 Shot 里抽出可合成的文本（优先旁白，次选对白）。
 */
export function extractSpeechText(shot: Shot): string | null {
  const narration = shot.narration?.trim();
  const dialogue = shot.dialogue?.trim();
  return narration || dialogue || null;
}

export class BatchVoiceAbortError extends Error {
  constructor() {
    super('用户中止了批量配音。');
    this.name = 'BatchVoiceAbortError';
  }
}

/**
 * 顺序为一批镜头合成配音。只处理有 narration 或 dialogue 的镜头。
 * 支持 AbortSignal 中止（只在每个 shot 边界生效）。
 */
export async function generateVoiceForShots(params: {
  shots: Shot[];
  speaker: string;
  onStart: (shotId: string) => void;
  onSuccess: (shotId: string, url: string, speaker: string) => void;
  onFailure: (shotId: string, error: string) => void;
  onSkip: (shotId: string) => void;
  signal?: AbortSignal;
}): Promise<{
  successCount: number;
  failCount: number;
  skipCount: number;
  aborted: boolean;
}> {
  const { shots, speaker, onStart, onSuccess, onFailure, onSkip, signal } =
    params;
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const shot of shots) {
    if (signal?.aborted) {
      return { successCount, failCount, skipCount, aborted: true };
    }
    const text = extractSpeechText(shot);
    if (!text) {
      onSkip(shot.id);
      skipCount++;
      continue;
    }
    onStart(shot.id);
    try {
      const url = await generateSpeech(text, speaker);
      onSuccess(shot.id, url, speaker);
      successCount++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      onFailure(shot.id, msg);
      failCount++;
    }
  }

  return { successCount, failCount, skipCount, aborted: false };
}

/**
 * 字幕转写：把音频 data URL 喂给 Gemini，让它写出带时间戳的字幕。
 * 返回原始文本（用户可再转 srt/ass）。
 */
export async function transcribeAudio(
  audioDataUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const m = audioDataUrl.match(/^data:(.*?);base64,(.+)$/);
  if (!m) throw new Error('音频 data URL 格式异常。');

  const ai = getGeminiClient();

  recordCall('stt');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.STT,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: m[1] ?? 'audio/wav',
                data: m[2]!,
              },
            },
            {
              text: '请把这段音频转写为带时间戳的字幕。使用 SRT 格式：\n1\n00:00:00,000 --> 00:00:03,000\n字幕内容\n\n2\n...\n\n只返回 SRT 字幕内容，不要解释。中文输出。',
            },
          ],
        },
      ],
    }),
    signal
  );

  return response.text ?? '';
}
