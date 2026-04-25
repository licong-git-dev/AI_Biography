import { ApiKeyMissingError } from './geminiClient';
import { isAbortError } from './abort';

/**
 * 把 Gemini SDK / 网络层的英文错误翻译成中文 + 给可操作的下一步。
 * 调用方式：
 *   try { ... } catch (e) {
 *     const { title, hint } = humanizeError(e);
 *     toast.error(`${title}\n${hint}`);
 *   }
 */
export interface HumanError {
  /** 一句话主题（中文） */
  title: string;
  /** 可执行的下一步（中文） */
  hint: string;
  /** 是否用户主动取消（不应该弹错） */
  aborted: boolean;
  /** 原始错误信息（debug 用） */
  raw: string;
}

const PATTERNS: Array<{
  match: (msg: string, name: string) => boolean;
  title: string;
  hint: string;
}> = [
  {
    match: (m) => /api[_ -]?key/i.test(m) && /(invalid|missing|not[ _]found)/i.test(m),
    title: 'API Key 无效',
    hint: '点 Header 右上角 API Key 药丸重新配置；确认从 aistudio.google.com/apikey 复制完整',
  },
  {
    match: (m) => /permission|denied|unauthorized|403/i.test(m),
    title: '权限不足',
    hint: '当前 API Key 可能没开通该模型。点 Header ⚙ 模型设置改成你账号有权限的备用 ID',
  },
  {
    match: (m) => /quota|exhausted|rate.{0,5}limit|429/i.test(m),
    title: '配额或限速触发',
    hint: '今日免费额度可能用尽。等 1-2 分钟再试；或在 Google Cloud 升级到付费计划',
  },
  {
    match: (m) => /model.{0,5}not.{0,5}found|not[_ -]?supported|404/i.test(m),
    title: '模型不存在或未开通',
    hint: '点 Header ⚙ 模型设置改成有权限的 ID，比如 gemini-2.5-pro / gemini-2.5-flash',
  },
  {
    match: (m) => /safety|blocked|harmful/i.test(m),
    title: '内容被安全策略拦截',
    hint: '改一下输入内容，避开敏感词；或在请求里降低安全阈值（需要在代码里改 safetySettings）',
  },
  {
    match: (m) => /timeout|timed.{0,3}out|deadline/i.test(m),
    title: '请求超时',
    hint: '网络可能不稳，重试一次。如反复超时，可能是 Gemini 服务端拥塞',
  },
  {
    match: (m) => /network|fetch|failed to fetch|connect/i.test(m),
    title: '网络错误',
    hint: '检查本机网络。Gemini API 在某些地区需要科学上网',
  },
  {
    match: (m) => /JSON|parse|unexpected/i.test(m),
    title: 'AI 返回的 JSON 格式错',
    hint: '通常重试一次就好。若反复失败，把模型切到非 thinking 模式（Header Brain 图标）',
  },
  {
    match: (m, n) => n === 'AiResponseValidationError',
    title: 'AI 返回结构校验未通过',
    hint: '返回的 JSON 缺字段或枚举值不对。重试一次；若反复，开启深度思考（Header Brain）能让模型更稳',
  },
  {
    match: (m) => /generateVideos|veo/i.test(m) && /not.{0,5}function|undefined/i.test(m),
    title: 'SDK 不支持 Veo 视频生成',
    hint: '当前 @google/genai 版本可能未暴露 generateVideos。等 SDK 升级，或暂时跳过视频生成',
  },
  {
    match: (m) => /quotaexceedederror|nsErr.*quota/i.test(m),
    title: '浏览器存储已满',
    hint: '点 Header 存储指示器一键清理 base64 图，或导出 JSON 备份后再清理',
  },
];

export function humanizeError(e: unknown): HumanError {
  const aborted = isAbortError(e);
  const raw =
    e instanceof Error
      ? `${e.name}: ${e.message}`
      : typeof e === 'string'
        ? e
        : JSON.stringify(e);

  if (aborted) {
    return {
      title: '已取消',
      hint: '',
      aborted: true,
      raw,
    };
  }

  if (e instanceof ApiKeyMissingError) {
    return {
      title: '未配置 API Key',
      hint: '点 Header 右上角 API Key 药丸配置一个 Gemini key',
      aborted: false,
      raw,
    };
  }

  const msg = e instanceof Error ? e.message : String(e);
  const name = e instanceof Error ? e.name : '';

  for (const p of PATTERNS) {
    if (p.match(msg, name)) {
      return {
        title: p.title,
        hint: p.hint,
        aborted: false,
        raw,
      };
    }
  }

  return {
    title: '调用失败',
    hint: msg.length > 100 ? `${msg.slice(0, 100)}…` : msg,
    aborted: false,
    raw,
  };
}

/**
 * 便捷封装：在 catch 里用 toast 显示。返回 aborted 让调用方判断要不要 reset 状态。
 */
export function showHumanError(e: unknown, toastErrorFn: (msg: string) => void): boolean {
  const h = humanizeError(e);
  if (h.aborted) return true;
  toastErrorFn(h.hint ? `${h.title}\n${h.hint}` : h.title);
  return false;
}
