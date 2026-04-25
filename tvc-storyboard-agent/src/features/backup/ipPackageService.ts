import type { Character } from '../../types';
import type { SavedHook, SavedStyleTemplate } from '../../stores/libraryStore';

export const IP_PACKAGE_SCHEMA_VERSION = 1;

/**
 * 跨项目可迁移的 IP 资产包。比 ProjectBackup 窄：
 * - 不含章节 / 集数 / 镜头（这些是特定 IP 的内容）
 * - 含：角色基线 + 金句库 + 风格模板
 *
 * 适用场景：做完第一部 IP，做第二部 IP 时想沿用同一套角色画风 + 金句
 * 语感 + 风格模板。
 */
export interface IpPackage {
  schemaVersion: number;
  name: string;
  exportedAt: number;
  sourceAppVersion?: string;
  characters: Character[];
  libraryHooks: SavedHook[];
  libraryStyles: SavedStyleTemplate[];
}

export function buildIpPackage(params: {
  name: string;
  characters: Character[];
  libraryHooks: SavedHook[];
  libraryStyles: SavedStyleTemplate[];
  stripReferenceImages?: boolean; // 导出时去掉 base64 减小体积
}): IpPackage {
  const { name, characters, libraryHooks, libraryStyles, stripReferenceImages } =
    params;

  return {
    schemaVersion: IP_PACKAGE_SCHEMA_VERSION,
    name: name.trim() || '未命名 IP',
    exportedAt: Date.now(),
    sourceAppVersion: '0.1',
    characters: stripReferenceImages
      ? characters.map((c) => ({ ...c, referenceImageUrl: undefined }))
      : characters,
    libraryHooks,
    libraryStyles: stripReferenceImages
      ? libraryStyles.map((s) => ({ ...s, thumbnailUrl: undefined }))
      : libraryStyles,
  };
}

export function parseIpPackage(text: string): IpPackage {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('不是有效的 JSON 文件');
  }
  const r = raw as Partial<IpPackage>;
  if (typeof r.schemaVersion !== 'number') {
    throw new Error('缺少 schemaVersion，可能不是 IP 包');
  }
  if (r.schemaVersion > IP_PACKAGE_SCHEMA_VERSION) {
    throw new Error(
      `IP 包版本 v${r.schemaVersion} 比当前 app (v${IP_PACKAGE_SCHEMA_VERSION}) 新`
    );
  }
  if (
    !Array.isArray(r.characters) ||
    !Array.isArray(r.libraryHooks) ||
    !Array.isArray(r.libraryStyles)
  ) {
    throw new Error('IP 包结构不完整，缺少 characters / hooks / styles');
  }
  return r as IpPackage;
}

export interface MergeResult {
  charactersAdded: number;
  charactersSkipped: number; // id 冲突
  hooksAdded: number;
  stylesAdded: number;
}

/**
 * 合并导入：
 * - 角色按 id 比对，重名 / 同 id 的跳过（不覆盖，避免弄坏本地编辑）
 * - 金句 / 风格模板都加时间戳新 id 后追加（允许重复，用户事后自己清）
 */
export function mergeIpPackage(params: {
  pkg: IpPackage;
  existingCharacters: Character[];
  addCharacter: (c: Character) => void;
  addHook: (
    hook: Omit<SavedHook, 'id' | 'savedAt'>
  ) => void;
  addStyle: (
    style: Omit<SavedStyleTemplate, 'id' | 'savedAt'>
  ) => void;
}): MergeResult {
  const {
    pkg,
    existingCharacters,
    addCharacter,
    addHook,
    addStyle,
  } = params;

  let charactersAdded = 0;
  let charactersSkipped = 0;
  const existingIds = new Set(existingCharacters.map((c) => c.id));

  for (const c of pkg.characters) {
    if (existingIds.has(c.id)) {
      charactersSkipped++;
      continue;
    }
    addCharacter(c);
    charactersAdded++;
  }

  for (const h of pkg.libraryHooks) {
    addHook({
      text: h.text,
      style: h.style,
      why: h.why,
      sourceEpisodeId: h.sourceEpisodeId,
    });
  }

  for (const s of pkg.libraryStyles) {
    addStyle({
      name: s.name,
      prompt: s.prompt,
      thumbnailUrl: s.thumbnailUrl,
      sourceShotId: s.sourceShotId,
    });
  }

  return {
    charactersAdded,
    charactersSkipped,
    hooksAdded: pkg.libraryHooks.length,
    stylesAdded: pkg.libraryStyles.length,
  };
}
