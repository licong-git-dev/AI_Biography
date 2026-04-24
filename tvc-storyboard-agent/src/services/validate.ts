/**
 * 手写的 AI 响应结构校验。不引入 Zod 等依赖；如字段缺失或类型不对，
 * 抛出人类可读的中文错误。
 */

export type ValidationPath = string;

export class AiResponseValidationError extends Error {
  constructor(message: string, public readonly path: ValidationPath = '$') {
    super(message);
    this.name = 'AiResponseValidationError';
  }
}

function requireObject(v: unknown, path: ValidationPath): Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new AiResponseValidationError(`${path} 应该是对象`, path);
  }
  return v as Record<string, unknown>;
}

function requireArray(v: unknown, path: ValidationPath): unknown[] {
  if (!Array.isArray(v)) {
    throw new AiResponseValidationError(`${path} 应该是数组`, path);
  }
  return v;
}

function requireString(v: unknown, path: ValidationPath): string {
  if (typeof v !== 'string') {
    throw new AiResponseValidationError(`${path} 应该是字符串`, path);
  }
  return v;
}

function optString(v: unknown, path: ValidationPath): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') {
    throw new AiResponseValidationError(`${path} 应该是字符串`, path);
  }
  return v;
}

function requireStringArray(v: unknown, path: ValidationPath): string[] {
  const arr = requireArray(v, path);
  return arr.map((x, i) => requireString(x, `${path}[${i}]`));
}

function optStringArray(v: unknown, path: ValidationPath): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  return requireStringArray(v, path);
}

function requireOneOf<T extends string>(
  v: unknown,
  allowed: readonly T[],
  path: ValidationPath
): T {
  const s = requireString(v, path);
  if (!(allowed as readonly string[]).includes(s)) {
    throw new AiResponseValidationError(
      `${path} 必须是 ${allowed.join(' / ')} 之一，实际是 "${s}"`,
      path
    );
  }
  return s as T;
}

function requireNumber(v: unknown, path: ValidationPath): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  throw new AiResponseValidationError(`${path} 应该是数字`, path);
}

// ---------- Episode (chapter split) ----------

const PRIORITIES = ['S', 'A', 'A-', 'B'] as const;
const EPISODE_FORMATS = [
  'A-主剧情',
  'B-爆点切片',
  'C-人物支线',
  'D-金句旁白',
] as const;

export interface ValidatedEpisodeProposal {
  title: string;
  hook: string;
  mainConflict: string;
  climax: string;
  suspense: string;
  memoryPoints: string[];
  platformSellingPoint: string;
  priority: (typeof PRIORITIES)[number];
  targetDuration: string;
  format: (typeof EPISODE_FORMATS)[number];
}

export function validateEpisodeProposals(
  raw: unknown
): ValidatedEpisodeProposal[] {
  const root = requireObject(raw, '$');
  const arr = requireArray(root.episodes, '$.episodes');
  if (arr.length === 0) {
    throw new AiResponseValidationError('episodes 数组为空', '$.episodes');
  }
  return arr.map((ep, i) => {
    const p = `$.episodes[${i}]`;
    const o = requireObject(ep, p);
    return {
      title: requireString(o.title, `${p}.title`),
      hook: requireString(o.hook, `${p}.hook`),
      mainConflict: requireString(o.mainConflict, `${p}.mainConflict`),
      climax: requireString(o.climax, `${p}.climax`),
      suspense: requireString(o.suspense, `${p}.suspense`),
      memoryPoints: requireStringArray(o.memoryPoints, `${p}.memoryPoints`),
      platformSellingPoint: requireString(
        o.platformSellingPoint,
        `${p}.platformSellingPoint`
      ),
      priority: requireOneOf(o.priority, PRIORITIES, `${p}.priority`),
      targetDuration: requireString(o.targetDuration, `${p}.targetDuration`),
      format: requireOneOf(o.format, EPISODE_FORMATS, `${p}.format`),
    };
  });
}

// ---------- Shot (episode → shotlist) ----------

const SHOT_SIZES = [
  '特写',
  '近景',
  '中景',
  '中近景',
  '全景',
  '远景',
  '大远景',
  '蒙太奇',
  '黑场/特写',
] as const;

const CAMERA_MOVES = [
  '推',
  '拉',
  '摇',
  '移',
  '跟',
  '升降',
  '固定',
  '后拉',
] as const;

const GEN_METHODS = [
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
] as const;

export interface ValidatedShotProposal {
  number: string;
  duration: number;
  shotSize: (typeof SHOT_SIZES)[number];
  description: string;
  narration?: string;
  dialogue?: string;
  characters: string[];
  audioNotes: string;
  genMethod: (typeof GEN_METHODS)[number];
  cameraMove?: (typeof CAMERA_MOVES)[number];
}

export function validateShotProposals(raw: unknown): ValidatedShotProposal[] {
  const root = requireObject(raw, '$');
  const arr = requireArray(root.shots, '$.shots');
  if (arr.length === 0) {
    throw new AiResponseValidationError('shots 数组为空', '$.shots');
  }
  return arr.map((s, i) => {
    const p = `$.shots[${i}]`;
    const o = requireObject(s, p);
    const cm = o.cameraMove;
    return {
      number: requireString(o.number, `${p}.number`),
      duration: requireNumber(o.duration, `${p}.duration`),
      shotSize: requireOneOf(o.shotSize, SHOT_SIZES, `${p}.shotSize`),
      description: requireString(o.description, `${p}.description`),
      narration: optString(o.narration, `${p}.narration`),
      dialogue: optString(o.dialogue, `${p}.dialogue`),
      characters:
        optStringArray(o.characters, `${p}.characters`) ?? [],
      audioNotes: requireString(o.audioNotes, `${p}.audioNotes`),
      genMethod: requireOneOf(o.genMethod, GEN_METHODS, `${p}.genMethod`),
      cameraMove:
        cm === undefined || cm === null
          ? undefined
          : requireOneOf(cm, CAMERA_MOVES, `${p}.cameraMove`),
    };
  });
}

// ---------- Publishing pack ----------

const PLATFORMS = ['抖音', '视频号', '小红书', 'B站'] as const;

export interface ValidatedPlatformCopy {
  platform: (typeof PLATFORMS)[number];
  title: string;
  description: string;
  tags: string[];
  coverText: string;
  pinnedComment?: string;
}

export function validatePublishingPlatforms(
  raw: unknown
): ValidatedPlatformCopy[] {
  const root = requireObject(raw, '$');
  const arr = requireArray(root.platforms, '$.platforms');
  if (arr.length === 0) {
    throw new AiResponseValidationError('platforms 数组为空', '$.platforms');
  }
  return arr.map((entry, i) => {
    const p = `$.platforms[${i}]`;
    const o = requireObject(entry, p);
    return {
      platform: requireOneOf(o.platform, PLATFORMS, `${p}.platform`),
      title: requireString(o.title, `${p}.title`),
      description: requireString(o.description, `${p}.description`),
      tags: requireStringArray(o.tags, `${p}.tags`),
      coverText: requireString(o.coverText, `${p}.coverText`),
      pinnedComment: optString(o.pinnedComment, `${p}.pinnedComment`),
    };
  });
}
