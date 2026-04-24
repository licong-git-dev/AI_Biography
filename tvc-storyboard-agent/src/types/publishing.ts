export type Platform = '抖音' | '视频号' | '小红书' | 'B站';

export const PLATFORMS: Platform[] = ['抖音', '视频号', '小红书', 'B站'];

export interface PlatformCopy {
  platform: Platform;
  title: string;
  description: string;
  tags: string[];
  coverText: string;
  pinnedComment?: string;
}

export interface PublishingPack {
  episodeId: string;
  generatedAt: number;
  platforms: PlatformCopy[];
}

/** 发布后的真实数据，用户手动录入。用于给下一集的 AI 调用做上下文。 */
export interface EpisodeMetric {
  platform: Platform;
  publishedAt?: number;
  completionRate?: number; // 0-100 百分比
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  notes?: string; // 评论区关键词、爆点要素、观众反馈摘要
}
