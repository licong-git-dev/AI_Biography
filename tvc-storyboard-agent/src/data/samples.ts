import type { Shot } from '../types';

// 来自 samples/sample-a/01-shotlist/sample-a-shotlist.md
// 样片 A《西山的灯一直亮着》对应 EP01
export const SAMPLE_A_SHOTS: Shot[] = [
  {
    id: 'sh-ep1-A-01',
    episodeId: 'ep-s1-01',
    number: 'A-01',
    duration: 5,
    shotSize: '大远景',
    description: '西山清晨，晨雾、日出、村庄苏醒',
    characters: [],
    audioNotes: '旁白开场 + 鸟鸣',
    genMethod: '图生视频/航拍感',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-02',
    episodeId: 'ep-s1-01',
    number: 'A-02',
    duration: 6,
    shotSize: '远景',
    description: '老屋外景，向日葵、晾衣绳、旧墙面',
    characters: [],
    audioNotes: '旁白',
    genMethod: '关键帧 + 缓推',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-03',
    episodeId: 'ep-s1-01',
    number: 'A-03',
    duration: 8,
    shotSize: '蒙太奇',
    description: '红色洗澡盆、影碟机《白雪公主》、早餐摊、梧桐树光斑',
    characters: ['li-cong-infant', 'grandma', 'grandpa'],
    audioNotes: '环境音 + 轻音乐',
    genMethod: '静图组接',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-04',
    episodeId: 'ep-s1-01',
    number: 'A-04',
    duration: 7,
    shotSize: '中景',
    description: '奶奶拍背哄睡，复古灯在墙上投出光影',
    characters: ['grandma', 'li-cong-infant'],
    audioNotes: '奶奶哼唱 + 旁白',
    genMethod: '关键帧 + 微动效',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-05',
    episodeId: 'ep-s1-01',
    number: 'A-05',
    duration: 8,
    shotSize: '中景',
    description: '父母背对背坐着，气氛沉重，孩子站在门口',
    characters: ['mother', 'li-cong-infant'],
    audioNotes: '音乐压低',
    genMethod: '图生视频',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-06',
    episodeId: 'ep-s1-01',
    number: 'A-06',
    duration: 6,
    shotSize: '远景',
    description: '父亲提着行李走远，孩子伸手想追',
    characters: ['li-cong-infant'],
    audioNotes: '旁白停顿',
    genMethod: '图生视频/后拉',
    cameraMove: '后拉',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-07',
    episodeId: 'ep-s1-01',
    number: 'A-07',
    duration: 10,
    shotSize: '蒙太奇',
    description: '公交车往返两个家，窗外乡村与城市切换',
    characters: ['li-cong-child', 'grandma', 'mother'],
    audioNotes: '公交车环境音 + 旁白',
    genMethod: '静图组接 + 窗外运动',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-08',
    episodeId: 'ep-s1-01',
    number: 'A-08',
    duration: 10,
    shotSize: '中近景',
    description: '奶奶塞花生、村口挥手、车窗倒影里的孩子',
    characters: ['grandma', 'li-cong-child'],
    audioNotes: '音乐抬高',
    genMethod: '特写图生视频 + 静图',
    genStatus: '未生成',
  },
  {
    id: 'sh-ep1-A-09',
    episodeId: 'ep-s1-01',
    number: 'A-09',
    duration: 8,
    shotSize: '黑场/特写',
    description: '夜里车窗反光与字幕收束',
    characters: ['li-cong-child'],
    audioNotes: '金句字幕',
    genMethod: 'Remotion 字幕卡点',
    genStatus: '未生成',
  },
];

export const SAMPLE_A_NARRATION =
  '三岁那年，我第一次知道，家也会分成两个。可我最先记住的，不是离开，而是西山脚下那盏一直亮着的灯。';

export const SAMPLE_A_CLOSING_LINES = [
  '我后来才明白，一个孩子最先学会的，往往不是长大，而是忍住想哭。',
  '那时候我还不知道，两个家之间来回的人生，才刚刚开始。',
];

export const SEED_SHOTS: Shot[] = [...SAMPLE_A_SHOTS];

/**
 * 把 sample-a 的镜头复制到指定 episode，返回全新 id 的 Shot 数组。
 * 不改 store，调用方决定 addMany / 覆盖策略。
 */
export function cloneSampleAShotsInto(episodeId: string): Shot[] {
  const stamp = Date.now().toString(36);
  return SAMPLE_A_SHOTS.map((s, i) => ({
    ...s,
    id: `sh-${episodeId}-A-${String(i + 1).padStart(2, '0')}-${stamp}`,
    episodeId,
    // 重置生成状态，避免误以为"已生成"
    keyframeUrl: undefined,
    keyframeStale: false,
    prompt: undefined,
    genStatus: '未生成',
    videoUrl: undefined,
    videoPrompt: undefined,
    videoGenStatus: undefined,
    voiceUrl: undefined,
    voiceSpeaker: undefined,
    voiceGenStatus: undefined,
    subtitleSrt: undefined,
  }));
}
