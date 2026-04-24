import type {
  Character,
  Episode,
  Shot,
} from '../../types';
import type { ChatMessage } from '../chat/chatService';

export const BACKUP_SCHEMA_VERSION = 1;

export interface ProjectBackup {
  schemaVersion: number;
  exportedAt: string; // ISO
  appVersion: string; // 手填，用于人类辨识
  characters: Character[];
  episodes: Episode[];
  shots: Shot[];
  chatMessages: ChatMessage[];
}

export function buildBackup(params: {
  appVersion: string;
  characters: Character[];
  episodes: Episode[];
  shots: Shot[];
  chatMessages: ChatMessage[];
}): ProjectBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: params.appVersion,
    characters: params.characters,
    episodes: params.episodes,
    shots: params.shots,
    chatMessages: params.chatMessages,
  };
}

/** 宽松校验：只认 schemaVersion 和 4 个数组存在，不严格校验每条字段（给未来 schema 一些 forward-compat 空间）。 */
export function parseBackup(text: string): ProjectBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `备份文件不是合法的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('备份文件顶层不是对象');
  }
  const b = parsed as Partial<ProjectBackup>;
  if (typeof b.schemaVersion !== 'number') {
    throw new Error('缺少 schemaVersion');
  }
  if (b.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `备份 schemaVersion ${b.schemaVersion} 新于当前支持的 ${BACKUP_SCHEMA_VERSION}`
    );
  }
  if (
    !Array.isArray(b.characters) ||
    !Array.isArray(b.episodes) ||
    !Array.isArray(b.shots) ||
    !Array.isArray(b.chatMessages)
  ) {
    throw new Error('备份缺少必需字段（characters/episodes/shots/chatMessages）');
  }
  return b as ProjectBackup;
}

export function downloadBackup(backup: ProjectBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = backup.exportedAt.replace(/[:.]/g, '-');
  a.href = url;
  a.download = `licong-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
