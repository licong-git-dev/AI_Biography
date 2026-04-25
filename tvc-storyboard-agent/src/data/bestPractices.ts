/**
 * 内置"好钩子 / 好描述 / 好文案"样板，作为所有 AI 提示词的冷启动参考。
 * 不是 feedback（那是用户反馈），这是行业公允的"爆款结构"示例。
 *
 * 注入方式：buildBestPracticesContext(kind) 拼成 markdown 前缀，走到
 * hookService / episodeService / publishingService 的 prompt 里。
 *
 * 这些样板**不是**针对《李聪传》的，是通用的短剧爆款公式。
 */

export interface HookExample {
  text: string;
  style: string;
  why: string;
}

export const HOOK_EXAMPLES: HookExample[] = [
  {
    text: '父亲关门那一刻，我才 3 岁。',
    style: '情绪共鸣',
    why: '把年龄作为反差放前半句，后半句一个动作给观众脑补全部背景',
  },
  {
    text: '你见过早上 6 点的西山吗？我奶奶见过，天天见。',
    style: '悬念设问',
    why: '设问开头 + 具体地点和时间，瞬间有画面有人物',
  },
  {
    text: '奶奶递来的那颗花生，我舍不得吃。',
    style: '视觉冲击',
    why: '道具 + 动作 + 情感三合一，一句话一个镜头',
  },
  {
    text: '从有两个家开始，我就学会了忍住想哭。',
    style: '金句宣告',
    why: '句式工整可做封面文案，"两个家"是共鸣钩',
  },
  {
    text: '别的小孩都等妈妈接，我等公交车。',
    style: '反差对比',
    why: '一句对比制造孤独感，不用形容词也能讲清楚',
  },
];

export interface ShotDescriptionExample {
  description: string;
  shotSize: string;
  why: string;
}

export const SHOT_DESCRIPTION_EXAMPLES: ShotDescriptionExample[] = [
  {
    description:
      '晨雾里的西山，远处炊烟升起，近处一只鸡从画面底部跑过，晨光刚漫到屋顶瓦片',
    shotSize: '大远景',
    why: '给时间（晨）+ 地点（西山）+ 生活气（鸡/炊烟）+ 光线方向，AI 好画',
  },
  {
    description:
      '奶奶布满皱纹的手把一颗花生放进男孩张开的掌心，男孩的手还有点脏',
    shotSize: '特写',
    why: '只拍"手"不拍脸，细节承载情绪，脏手补充真实感',
  },
  {
    description:
      '公交车窗外乡村→城市的景色切换，车内孩子的倒影叠在窗玻璃上',
    shotSize: '中景',
    why: '一个镜头交代"两个世界"的切换 + 观察者视角',
  },
];

export interface PublishingCopyExample {
  platform: string;
  title: string;
  coverText: string;
  why: string;
}

export const PUBLISHING_EXAMPLES: PublishingCopyExample[] = [
  {
    platform: '抖音',
    title: '我三岁那年，父亲悄悄关了那扇门',
    coverText: '那扇门关上\n我 3 岁',
    why: '标题用"悄悄"制造悬念，封面两行字第一行场景第二行反差',
  },
  {
    platform: '小红书',
    title: '奶奶给的那颗花生，我攥了一路没吃 🥜',
    coverText: '这颗花生\n我攥了十年',
    why: '标题带 emoji + 动作细节，封面时间跨度反差',
  },
  {
    platform: 'B站',
    title: '【李聪传·第一集】在两个家之间，小孩先学会的是什么',
    coverText: '两个家 一个人',
    why: 'B站允许更长更结构化的标题，封面极简',
  },
];

export function buildBestPracticesContext(
  kind: 'hook' | 'shot' | 'publishing'
): string {
  if (kind === 'hook') {
    const lines = HOOK_EXAMPLES.map(
      (h) => `- [${h.style}]「${h.text}」— ${h.why}`
    ).join('\n');
    return `【短剧钩子爆款样板（通用行业参考，不是针对本 IP）】\n${lines}\n\n请参考这些样板的结构和密度，不要硬抄文字。`;
  }
  if (kind === 'shot') {
    const lines = SHOT_DESCRIPTION_EXAMPLES.map(
      (s) => `- [${s.shotSize}] ${s.description} — ${s.why}`
    ).join('\n');
    return `【镜头描述样板】\n${lines}\n\n画面要给时间/地点/动作/细节，而不是形容词。`;
  }
  const lines = PUBLISHING_EXAMPLES.map(
    (p) =>
      `- [${p.platform}] 标题「${p.title}」· 封面「${p.coverText.replace(/\n/g, ' / ')}」— ${p.why}`
  ).join('\n');
  return `【平台文案样板】\n${lines}\n\n不同平台的结构不同，不要一份文案通用。`;
}
