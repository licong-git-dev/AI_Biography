import React, { useState } from 'react';
import {
  useShotStore,
  useEpisodeStore,
  useCharacterStore,
  useChapterStore,
  useUIStore,
} from '../../stores';
import type { Shot, ShotGenStatus } from '../../types';
import {
  generateShotsForEpisode,
  type GeneratedShot,
} from '../episodes/episodeService';
import { generateKeyframesForShots } from './shotService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import ShotKeyframeModal from './ShotKeyframeModal';

const STATUS_COLOR: Record<ShotGenStatus, string> = {
  未生成: 'bg-neutral-800 text-neutral-500',
  生成中: 'bg-sky-900/40 text-sky-300 animate-pulse',
  已生成: 'bg-emerald-900/40 text-emerald-300',
  失败: 'bg-red-900/40 text-red-300',
};

const ShotTable: React.FC = () => {
  const shots = useShotStore((s) => s.shots);
  const addMany = useShotStore((s) => s.addMany);
  const setGenStatus = useShotStore((s) => s.setGenStatus);
  const setKeyframe = useShotStore((s) => s.setKeyframe);
  const setPrompt = useShotStore((s) => s.setPrompt);

  const activeEpisodeId = useEpisodeStore((s) => s.activeId);
  const getEpisode = useEpisodeStore((s) => s.getById);
  const getCharacter = useCharacterStore((s) => s.getById);
  const characters = useCharacterStore((s) => s.characters);
  const chapters = useChapterStore((s) => s.chapters);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  // AI 生成镜头表
  const [targetCount, setTargetCount] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<GeneratedShot[] | null>(null);

  // 批量关键帧
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);

  // 详情 modal
  const [detailShotId, setDetailShotId] = useState<string | null>(null);

  const filteredShots = activeEpisodeId
    ? shots.filter((s) => s.episodeId === activeEpisodeId)
    : shots;

  const activeEpisode = activeEpisodeId ? getEpisode(activeEpisodeId) : null;

  const handleGenerateShotList = async () => {
    if (!activeEpisode) return;
    setError(null);
    setGenerating(true);
    setProposals(null);
    try {
      const sourceChapter = chapters.find((c) =>
        activeEpisode.sourceChapters.includes(c.number)
      );
      const result = await generateShotsForEpisode({
        episode: activeEpisode,
        characters,
        chapterExcerpt: sourceChapter?.content ?? null,
        targetCount,
      });
      setProposals(result);
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

  const handleSaveProposals = () => {
    if (!proposals || !activeEpisode) return;
    const newShots: Shot[] = proposals.map((p, idx) => {
      const num = p.number || String(idx + 1).padStart(2, '0');
      return {
        id: `sh-${activeEpisode.id}-${num}-${Math.random().toString(36).slice(2, 6)}`,
        episodeId: activeEpisode.id,
        number: num,
        duration: p.duration,
        shotSize: p.shotSize,
        description: p.description,
        characters: p.characters ?? [],
        audioNotes: p.audioNotes,
        genMethod: p.genMethod,
        cameraMove: p.cameraMove,
        narration: p.narration,
        dialogue: p.dialogue,
        genStatus: '未生成',
      };
    });
    addMany(newShots);
    setProposals(null);
  };

  const handleBatchKeyframes = async () => {
    if (!activeEpisode || filteredShots.length === 0) return;
    setBatchSummary(null);
    setBatchRunning(true);
    try {
      const result = await generateKeyframesForShots({
        shots: filteredShots,
        characters,
        onStart: (id) => setGenStatus(id, '生成中'),
        onSuccess: (id, url, prompt) => {
          setKeyframe(id, url);
          setPrompt(id, prompt);
        },
        onFailure: (id) => setGenStatus(id, '失败'),
      });
      setBatchSummary(
        `完成：${result.successCount} 成功 · ${result.failCount} 失败`
      );
    } catch (e) {
      if (e instanceof ApiKeyMissingError) {
        openApiKey();
        setBatchSummary('未配置 API Key');
      } else {
        setBatchSummary(
          `批量中断：${e instanceof Error ? e.message : String(e)}`
        );
      }
    } finally {
      setBatchRunning(false);
    }
  };

  const ungenCount = filteredShots.filter(
    (s) => s.genStatus === '未生成' || s.genStatus === '失败'
  ).length;

  return (
    <div>
      {/* 顶部状态行 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-neutral-400">
          {activeEpisode ? (
            <>
              当前过滤：EP
              {String(activeEpisode.episodeNumber).padStart(2, '0')}
              《{activeEpisode.title}》· {filteredShots.length} 条镜头
            </>
          ) : (
            <>
              全部镜头 · {filteredShots.length} 条（「集数」tab 选中一集后过滤）
            </>
          )}
        </div>
        {activeEpisode && filteredShots.length > 0 && (
          <button
            onClick={handleBatchKeyframes}
            disabled={batchRunning || ungenCount === 0}
            className="rounded border border-sky-800 bg-sky-900/30 px-2.5 py-1 text-[11px] font-medium text-sky-200 hover:border-sky-700 hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            title={
              ungenCount === 0
                ? '全部已生成'
                : `将为 ${ungenCount} 个未生成的镜头依次调 Nano Banana Pro`
            }
          >
            {batchRunning
              ? '批量生成中…'
              : `生成本集全部关键帧（${ungenCount}）`}
          </button>
        )}
      </div>

      {batchSummary && (
        <div className="mb-3 rounded border border-neutral-800 bg-neutral-900/40 p-2 text-[11px] text-neutral-300">
          {batchSummary}
        </div>
      )}

      {/* AI 生成镜头表（空态 + 有选中集） */}
      {activeEpisode && filteredShots.length === 0 && !proposals && (
        <div className="mb-4 rounded-lg border border-dashed border-sky-900/50 bg-sky-950/10 p-6 text-center">
          <p className="text-sm text-neutral-300">
            本集暂无镜头表。让 AI 根据集信息和章节节选拆出镜头表 →
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <label className="text-[11px] text-neutral-400">目标镜头数</label>
            <select
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              disabled={generating}
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
            >
              {[6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateShotList}
              disabled={generating}
              className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generating ? '生成中…（15-30 秒）' : 'AI 生成镜头表'}
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {/* AI 提议的镜头表预览 */}
      {proposals && proposals.length > 0 && activeEpisode && (
        <div className="mb-4 rounded-lg border border-sky-900/40 bg-sky-950/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-300">
              AI 提议的 {proposals.length} 个镜头：
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setProposals(null)}
                className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700"
                type="button"
              >
                丢弃
              </button>
              <button
                onClick={handleSaveProposals}
                className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                type="button"
              >
                全部保存到镜头表
              </button>
            </div>
          </div>
          <ShotPreviewTable
            proposals={proposals}
            getCharacter={getCharacter}
          />
        </div>
      )}

      {/* 已存在的镜头表 */}
      {filteredShots.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">镜号</th>
                <th className="px-3 py-2 font-medium">景别</th>
                <th className="px-3 py-2 font-medium">时长</th>
                <th className="px-3 py-2 font-medium">画面描述</th>
                <th className="px-3 py-2 font-medium">角色</th>
                <th className="px-3 py-2 font-medium">关键帧</th>
                <th className="px-3 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredShots.map((shot) => {
                const charNames = shot.characters
                  .map((id) => getCharacter(id)?.name ?? id)
                  .join('、');
                return (
                  <tr
                    key={shot.id}
                    onClick={() => setDetailShotId(shot.id)}
                    className="cursor-pointer bg-neutral-950 hover:bg-neutral-900/60"
                  >
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {shot.number}
                    </td>
                    <td className="px-3 py-2 text-neutral-300">
                      {shot.shotSize}
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      {shot.duration}s
                    </td>
                    <td className="px-3 py-2 text-neutral-200">
                      {shot.description}
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      {charNames || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {shot.keyframeUrl ? (
                        <img
                          src={shot.keyframeUrl}
                          alt=""
                          className="h-12 w-auto rounded border border-neutral-800"
                        />
                      ) : (
                        <span className="text-[10px] text-neutral-600">
                          点击生成
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_COLOR[shot.genStatus]}`}
                      >
                        {shot.genStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredShots.length === 0 && !activeEpisode && (
        <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
          在「集数」tab 先选中一集，回来就能 AI 生成镜头表。
        </div>
      )}

      <ShotKeyframeModal
        shotId={detailShotId}
        onClose={() => setDetailShotId(null)}
      />
    </div>
  );
};

const ShotPreviewTable: React.FC<{
  proposals: GeneratedShot[];
  getCharacter: (id: string) => { name: string } | undefined;
}> = ({ proposals, getCharacter }) => (
  <div className="overflow-x-auto rounded border border-neutral-800/50">
    <table className="w-full text-left text-[11px]">
      <thead className="bg-neutral-900/60 text-neutral-400">
        <tr>
          <th className="px-2 py-1.5">镜号</th>
          <th className="px-2 py-1.5">景别</th>
          <th className="px-2 py-1.5">时长</th>
          <th className="px-2 py-1.5">画面</th>
          <th className="px-2 py-1.5">旁白/对白</th>
          <th className="px-2 py-1.5">角色</th>
          <th className="px-2 py-1.5">方式</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-800/50">
        {proposals.map((p, idx) => {
          const names = (p.characters ?? [])
            .map((id) => getCharacter(id)?.name ?? id)
            .join('、');
          return (
            <tr key={idx} className="bg-neutral-950/40">
              <td className="px-2 py-1.5 font-mono text-neutral-500">
                {p.number}
              </td>
              <td className="px-2 py-1.5">{p.shotSize}</td>
              <td className="px-2 py-1.5">{p.duration}s</td>
              <td className="px-2 py-1.5">{p.description}</td>
              <td className="px-2 py-1.5 text-neutral-400">
                {[p.narration, p.dialogue].filter(Boolean).join(' / ') || '—'}
              </td>
              <td className="px-2 py-1.5 text-neutral-400">{names || '—'}</td>
              <td className="px-2 py-1.5 text-neutral-500">{p.genMethod}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ShotTable;
