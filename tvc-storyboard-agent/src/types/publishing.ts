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
