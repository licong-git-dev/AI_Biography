export type CharacterGroup = '主角' | '家人' | '伴侣' | '朋友';

export type AgeStage =
  | '幼年'
  | '童年'
  | '少年'
  | '青春期'
  | '青年'
  | '中年'
  | '老年'
  | '全时期';

export interface Character {
  id: string;
  name: string;
  group: CharacterGroup;
  ageStage: AgeStage;
  ageRange: string;
  positioning: string;
  appearance: string[];
  vibe: string[];
  outfits: string[];
  inheritedTraits?: string[];
  promptBaseline: string;
  voiceNotes: string[];
  referenceImageUrl?: string;
  relatedChapters?: number[];
}
