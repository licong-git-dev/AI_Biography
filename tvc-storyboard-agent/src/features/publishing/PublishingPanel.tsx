import React, { useState } from 'react';
import { Check, Circle } from 'lucide-react';
import type { Episode, Platform } from '../../types';
import { PLATFORMS } from '../../types';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import { generatePublishingPack } from './publishingService';
import { exportEpisodeZip, downloadBlob } from './exportService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import Spinner from '../../components/Spinner';

interface Props {
  episode: Episode;
}

const PublishingPanel: React.FC<Props> = ({ episode }) => {
  const update = useEpisodeStore((s) => s.update);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const shots = useShotStore((s) => s.byEpisode(episode.id));
  const characters = useCharacterStore((s) => s.characters);

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('抖音');

  const pack = episode.publishingPack;
  const currentCopy = pack?.platforms.find((p) => p.platform === activePlatform);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const newPack = await generatePublishingPack(episode);
      update(episode.id, { publishingPack: newPack });
    } catch (e) {
      if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 静默失败
    }
  };

  const handleExport = async () => {
    setError(null);
    setExporting(true);
    setExportProgress(0);
    try {
      const blob = await exportEpisodeZip({
        episode,
        shots,
        characters,
        onProgress: setExportProgress,
      });
      const filename = `EP${String(episode.episodeNumber).padStart(2, '0')}-${episode.title.replace(/[\\/:*?"<>|]/g, '_')}.zip`;
      downloadBlob(blob, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const hasAnyAsset =
    shots.length > 0 &&
    (shots.some((s) => s.keyframeUrl) ||
      shots.some((s) => s.videoUrl) ||
      shots.some((s) => s.voiceUrl) ||
      !!episode.publishingPack);

  // 合规检查清单
  const checklist = [
    {
      label: '所有镜头已有关键帧',
      pass: shots.length > 0 && shots.every((s) => s.keyframeUrl),
    },
    {
      label: '所有镜头已有视频',
      pass: shots.length > 0 && shots.every((s) => s.videoUrl),
    },
    {
      label: '有旁白的镜头已配音',
      pass:
        shots
          .filter((s) => s.narration || s.dialogue)
          .every((s) => s.voiceUrl) &&
        shots.some((s) => s.narration || s.dialogue),
    },
    {
      label: '平台发布文案已生成',
      pass: !!pack,
    },
  ];

  return (
    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium text-neutral-200">发布准备</div>
        {pack && (
          <span className="text-[10px] text-neutral-500">
            {new Date(pack.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* 合规检查清单 */}
      <div className="mb-3 space-y-1">
        {checklist.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px]"
          >
            {c.pass ? (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-800 text-emerald-100">
                <Check size={9} strokeWidth={3} />
              </span>
            ) : (
              <Circle size={14} className="text-neutral-600" />
            )}
            <span
              className={c.pass ? 'text-neutral-300' : 'text-neutral-500'}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* 平台切换 */}
      {pack && (
        <div className="mb-3 flex gap-1 border-b border-neutral-800">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              type="button"
              className={`relative px-2 py-1 text-[11px] transition ${
                activePlatform === p
                  ? 'text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {p}
              {activePlatform === p && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-neutral-100" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 当前平台文案 */}
      {currentCopy ? (
        <div className="space-y-2.5 text-[11px]">
          <CopyField
            label="标题"
            value={currentCopy.title}
            onCopy={handleCopy}
          />
          <CopyField
            label="简介"
            value={currentCopy.description}
            onCopy={handleCopy}
            multiline
          />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-neutral-500">标签</span>
              <button
                onClick={() => handleCopy(currentCopy.tags.map(t => `#${t}`).join(' '))}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
                type="button"
              >
                复制
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentCopy.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <CopyField
            label="封面文案"
            value={currentCopy.coverText}
            onCopy={handleCopy}
          />
          {currentCopy.pinnedComment && (
            <CopyField
              label="置顶评论"
              value={currentCopy.pinnedComment}
              onCopy={handleCopy}
              multiline
            />
          )}
        </div>
      ) : (
        !generating && (
          <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-3 text-center text-[11px] text-neutral-500">
            还没生成平台文案包
          </div>
        )
      )}

      {error && (
        <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[10px] text-red-300">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={handleExport}
          disabled={exporting || !hasAnyAsset}
          className="flex items-center gap-1.5 rounded border border-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800/50 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          title={
            hasAnyAsset
              ? '打包镜头表 MD / CSV / 关键帧 / 视频 / 配音 / 发布包为 zip'
              : '还没生成任何资产'
          }
        >
          {exporting && <Spinner size={11} />}
          {exporting
            ? exportProgress > 0
              ? `打包中… ${exportProgress}%`
              : '打包中…'
            : '导出本集 zip'}
        </button>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded bg-sky-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {generating && <Spinner size={11} />}
          {generating ? '生成中…' : pack ? '重新生成文案' : '生成平台文案'}
        </button>
      </div>
    </div>
  );
};

const CopyField: React.FC<{
  label: string;
  value: string;
  onCopy: (text: string) => void;
  multiline?: boolean;
}> = ({ label, value, onCopy, multiline }) => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <button
        onClick={() => onCopy(value)}
        className="text-[10px] text-neutral-500 hover:text-neutral-300"
        type="button"
      >
        复制
      </button>
    </div>
    <div
      className={`rounded bg-neutral-900/60 p-2 text-neutral-200 ${
        multiline ? 'whitespace-pre-wrap' : ''
      }`}
    >
      {value}
    </div>
  </div>
);

export default PublishingPanel;
