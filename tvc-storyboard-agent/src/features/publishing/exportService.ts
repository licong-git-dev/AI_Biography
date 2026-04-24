import JSZip from 'jszip';
import type { Character, Episode, Shot } from '../../types';

/**
 * 把本集所有 AI 生成资产打包成 zip。
 * 目录结构：
 *   <episode-slug>/
 *   ├── episode.md              集信息 + 镜头表（markdown）
 *   ├── shotlist.csv            镜头表 CSV（与 samples/ 对齐）
 *   ├── characters.md           本集出场角色基线节选
 *   ├── publishing.json         发布包（如已生成）
 *   └── shots/
 *       └── <number>/
 *           ├── keyframe.png
 *           ├── video.mp4
 *           ├── voice.wav
 *           └── prompt.txt      AI 生成提示词（如有）
 */
export async function exportEpisodeZip(params: {
  episode: Episode;
  shots: Shot[];
  characters: Character[];
}): Promise<Blob> {
  const { episode, shots, characters } = params;
  const zip = new JSZip();
  const slug = episodeSlug(episode);
  const root = zip.folder(slug)!;

  root.file('episode.md', buildEpisodeMarkdown(episode, shots, characters));
  root.file('shotlist.csv', buildShotlistCsv(shots, characters));

  const involvedIds = new Set(shots.flatMap((s) => s.characters));
  const involved = characters.filter((c) => involvedIds.has(c.id));
  if (involved.length > 0) {
    root.file('characters.md', buildCharactersMarkdown(involved));
  }

  if (episode.publishingPack) {
    root.file(
      'publishing.json',
      JSON.stringify(episode.publishingPack, null, 2)
    );
  }

  const shotsFolder = root.folder('shots')!;
  for (const shot of shots) {
    const dir = shotsFolder.folder(safeSegment(shot.number))!;

    if (shot.keyframeUrl) {
      const { ext, data } = decodeDataUrl(shot.keyframeUrl);
      dir.file(`keyframe.${ext || 'png'}`, data, { base64: true });
    }
    if (shot.videoUrl) {
      const { ext, data } = decodeDataUrl(shot.videoUrl);
      dir.file(`video.${ext || 'mp4'}`, data, { base64: true });
    }
    if (shot.voiceUrl) {
      const { ext, data } = decodeDataUrl(shot.voiceUrl);
      dir.file(`voice.${ext || 'wav'}`, data, { base64: true });
    }
    if (shot.prompt) {
      dir.file('prompt.txt', shot.prompt);
    }
    if (shot.videoPrompt) {
      dir.file('video-prompt.txt', shot.videoPrompt);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * 把一季所有集打包成一个大 zip。每集一个子目录，跟 exportEpisodeZip 输出结构一致。
 * 顶层加一份 season-summary.md 索引。
 */
export async function exportSeasonZip(params: {
  seasonNumber: number;
  seasonName: string;
  episodes: Episode[];
  allShots: Shot[];
  characters: Character[];
}): Promise<Blob> {
  const { seasonNumber, seasonName, episodes, allShots, characters } = params;
  const zip = new JSZip();
  const root = zip.folder(`Season-${seasonNumber}-${safeSegment(seasonName)}`)!;

  root.file('characters.md', buildCharactersMarkdown(characters));
  root.file('season-summary.md', buildSeasonSummary(seasonName, episodes, allShots));

  for (const ep of episodes) {
    const slug = episodeSlug(ep);
    const epFolder = root.folder(slug)!;
    const shots = allShots.filter((s) => s.episodeId === ep.id);

    epFolder.file('episode.md', buildEpisodeMarkdown(ep, shots, characters));
    epFolder.file('shotlist.csv', buildShotlistCsv(shots, characters));
    if (ep.publishingPack) {
      epFolder.file(
        'publishing.json',
        JSON.stringify(ep.publishingPack, null, 2)
      );
    }

    const shotsFolder = epFolder.folder('shots')!;
    for (const shot of shots) {
      const dir = shotsFolder.folder(safeSegment(shot.number))!;
      if (shot.keyframeUrl) {
        const { ext, data } = decodeDataUrl(shot.keyframeUrl);
        dir.file(`keyframe.${ext || 'png'}`, data, { base64: true });
      }
      if (shot.videoUrl) {
        const { ext, data } = decodeDataUrl(shot.videoUrl);
        dir.file(`video.${ext || 'mp4'}`, data, { base64: true });
      }
      if (shot.voiceUrl) {
        const { ext, data } = decodeDataUrl(shot.voiceUrl);
        dir.file(`voice.${ext || 'wav'}`, data, { base64: true });
      }
      if (shot.prompt) dir.file('prompt.txt', shot.prompt);
      if (shot.videoPrompt) dir.file('video-prompt.txt', shot.videoPrompt);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

function buildSeasonSummary(
  seasonName: string,
  episodes: Episode[],
  allShots: Shot[]
): string {
  const stats = episodes.map((ep) => {
    const shots = allShots.filter((s) => s.episodeId === ep.id);
    return {
      ep,
      total: shots.length,
      keyframes: shots.filter((s) => s.keyframeUrl).length,
      videos: shots.filter((s) => s.videoUrl).length,
      voices: shots.filter((s) => s.voiceUrl).length,
      hasPack: !!ep.publishingPack,
    };
  });

  const totalShots = stats.reduce((a, s) => a + s.total, 0);
  const totalKeyframes = stats.reduce((a, s) => a + s.keyframes, 0);
  const totalVideos = stats.reduce((a, s) => a + s.videos, 0);
  const totalVoices = stats.reduce((a, s) => a + s.voices, 0);
  const packed = stats.filter((s) => s.hasPack).length;

  return `# ${seasonName}

> 全季导出时间：${new Date().toISOString()}
> 集数：${episodes.length}
> 镜头总数：${totalShots}
> 已生成关键帧：${totalKeyframes}
> 已生成视频：${totalVideos}
> 已配音：${totalVoices}
> 已生成平台文案：${packed}

## 集数明细

| EP | 标题 | 优先级 | 状态 | 镜头 | 关键帧 | 视频 | 配音 | 文案 |
|----|------|--------|------|------|-------|------|------|------|
${stats
  .map((s) => {
    const pad = String(s.ep.episodeNumber).padStart(2, '0');
    return `| ${pad} | 《${s.ep.title}》 | ${s.ep.priority} | ${s.ep.status} | ${s.total} | ${s.keyframes} | ${s.videos} | ${s.voices} | ${s.hasPack ? '✓' : '—'} |`;
  })
  .join('\n')}
`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- helpers ----------

function episodeSlug(ep: Episode): string {
  const n = String(ep.episodeNumber).padStart(2, '0');
  return `EP${n}-${safeSegment(ep.title)}`;
}

function safeSegment(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '_').trim() || 'item';
}

function decodeDataUrl(dataUrl: string): { ext: string; data: string } {
  const m = dataUrl.match(/^data:(.*?);base64,(.+)$/);
  if (!m || !m[2]) return { ext: '', data: '' };
  const mime = m[1] ?? '';
  const ext = mime.split('/')[1]?.split('+')[0] ?? '';
  return { ext, data: m[2] };
}

function buildEpisodeMarkdown(
  ep: Episode,
  shots: Shot[],
  characters: Character[]
): string {
  const charName = (id: string) =>
    characters.find((c) => c.id === id)?.name ?? id;
  const totalDuration = shots.reduce((acc, s) => acc + s.duration, 0);

  return `# EP${String(ep.episodeNumber).padStart(2, '0')}《${ep.title}》

> S${ep.seasonNumber} · ${ep.format} · ${ep.priority} · ${ep.status}
> 目标时长：${ep.targetDuration}（镜头合计 ${totalDuration} 秒）
> 来源：第 ${ep.sourceChapters.join('、')} 章

## 主冲突
${ep.mainConflict}

${ep.hook ? `## 钩子\n${ep.hook}\n` : ''}
${ep.climax ? `## 高潮\n${ep.climax}\n` : ''}
${ep.suspense ? `## 悬念\n${ep.suspense}\n` : ''}

## 记忆点
${ep.memoryPoints.map((p) => `- ${p}`).join('\n')}

## 平台卖点
${ep.platformSellingPoint}

## 镜头表

| 镜号 | 时长 | 景别 | 画面 | 角色 | 旁白 | 对白 | 方式 | 帧 | 视频 | 配音 |
|------|------|------|------|------|------|------|------|-----|------|------|
${shots
  .map((s) => {
    const names = s.characters.map(charName).join('、') || '—';
    const narr = (s.narration ?? '').replace(/\|/g, '\\|') || '—';
    const dial = (s.dialogue ?? '').replace(/\|/g, '\\|') || '—';
    return `| ${s.number} | ${s.duration}s | ${s.shotSize} | ${s.description.replace(/\|/g, '\\|')} | ${names} | ${narr} | ${dial} | ${s.genMethod} | ${s.keyframeUrl ? '✓' : '—'} | ${s.videoUrl ? '✓' : '—'} | ${s.voiceUrl ? '✓' : '—'} |`;
  })
  .join('\n')}

---

生成时间：${new Date().toISOString()}
`;
}

function buildShotlistCsv(shots: Shot[], characters: Character[]): string {
  const charName = (id: string) =>
    characters.find((c) => c.id === id)?.name ?? id;

  const header = [
    '镜号',
    '时长',
    '景别',
    '运镜',
    '画面描述',
    '角色',
    '旁白',
    '对白',
    '声音',
    '生成方式',
    '帧状态',
    '视频状态',
    '配音状态',
  ].join(',');

  const rows = shots.map((s) => {
    const fields = [
      s.number,
      String(s.duration),
      s.shotSize,
      s.cameraMove ?? '',
      s.description,
      s.characters.map(charName).join('、'),
      s.narration ?? '',
      s.dialogue ?? '',
      s.audioNotes,
      s.genMethod,
      s.genStatus,
      s.videoGenStatus ?? '未生成',
      s.voiceGenStatus ?? '未生成',
    ];
    return fields.map(csvEscape).join(',');
  });

  return [header, ...rows].join('\n');
}

function csvEscape(v: string): string {
  if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildCharactersMarkdown(characters: Character[]): string {
  return `# 本集出场角色基线

${characters
  .map(
    (c) => `## ${c.name}
- 组：${c.group} · ${c.ageStage} · ${c.ageRange}
- 定位：${c.positioning}
- 气质：${c.vibe.join('、')}
- 典型服装：${c.outfits[0] ?? '—'}
- 英文基线：${c.promptBaseline}
- 一致性参考图：${c.referenceImageUrl ? '已生成' : '未生成'}`
  )
  .join('\n\n')}
`;
}
