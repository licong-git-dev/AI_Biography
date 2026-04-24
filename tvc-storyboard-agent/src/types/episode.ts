export type EpisodeFormat =
  | 'A-主剧情'
  | 'B-爆点切片'
  | 'C-人物支线'
  | 'D-金句旁白';

export type EpisodeStatus = '规划中' | '生产中' | '待审' | '已完成';

export type Priority = 'S' | 'A' | 'A-' | 'B';

import type { EpisodeMetric, PublishingPack } from './publishing';

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

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
  hook?: string;
  climax?: string;
  suspense?: string;
  publishingPack?: PublishingPack;
  /** 发布后录入的真实数据，驱动后续集的 AI 生成 */
  metrics?: EpisodeMetric[];
  /** 计划发布日期（时间戳），用于发布 calendar */
  plannedReleaseAt?: number;
  /** 指派给谁 */
  assignee?: string;
  /** 制作笔记 / 评论，多人协作时 @ 留言 */
  comments?: Comment[];
}
