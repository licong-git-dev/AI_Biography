export type ShotSize =
  | '特写'
  | '近景'
  | '中景'
  | '中近景'
  | '全景'
  | '远景'
  | '大远景'
  | '蒙太奇'
  | '黑场/特写';

export type CameraMove =
  | '推'
  | '拉'
  | '摇'
  | '移'
  | '跟'
  | '升降'
  | '固定'
  | '后拉';

export type GenMethod =
  | '关键帧'
  | '关键帧 + 缓推'
  | '关键帧 + 微动效'
  | '图生视频'
  | '图生视频/航拍感'
  | '图生视频/后拉'
  | '静图组接'
  | '静图组接 + 窗外运动'
  | '特写图生视频 + 静图'
  | 'Remotion 字幕卡点';

export type ShotGenStatus = '未生成' | '生成中' | '已生成' | '失败';

export interface Shot {
  id: string;
  episodeId: string;
  number: string;
  duration: number;
  shotSize: ShotSize;
  description: string;
  characters: string[];
  audioNotes: string;
  genMethod: GenMethod;
  cameraMove?: CameraMove;
  narration?: string;
  dialogue?: string;
  prompt?: string;
  keyframeUrl?: string;
  genStatus: ShotGenStatus;
}
