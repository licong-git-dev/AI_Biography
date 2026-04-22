export type EpisodeFormat =
  | 'A-主剧情'
  | 'B-爆点切片'
  | 'C-人物支线'
  | 'D-金句旁白';

export type EpisodeStatus = '规划中' | '生产中' | '待审' | '已完成';

export type Priority = 'S' | 'A' | 'A-' | 'B';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  sourceChapters: number[];
  mainConflict: string;
  memoryPoints: string[];
  platformSellingPoint: string;
  priority: Priority;
  format: EpisodeFormat;
  targetDuration: string;
  status: EpisodeStatus;
  shotIds?: string[];
}
