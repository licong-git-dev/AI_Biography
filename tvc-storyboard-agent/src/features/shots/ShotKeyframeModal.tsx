import React, { useState } from 'react';
import type { Shot } from '../../types';
import { useCharacterStore, useShotStore, useUIStore } from '../../stores';
import { generateShotKeyframe } from './shotService';
import { ApiKeyMissingError } from '../../services/geminiClient';

interface Props {
  shotId: string | null;
  onClose: () => void;
}

const ShotKeyframeModal: React.FC<Props> = ({ shotId, onClose }) => {
  const shot = useShotStore((s) => (shotId ? s.getById(shotId) : undefined));
  const setKeyframe = useShotStore((s) => s.setKeyframe);
  const setGenStatus = useShotStore((s) => s.setGenStatus);
  const setPrompt = useShotStore((s) => s.setPrompt);
  const characters = useCharacterStore((s) => s.characters);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shotId || !shot) return null;

  const involved = characters.filter((c) => shot.characters.includes(c.id));
  const refsReady = involved.filter((c) => c.referenceImageUrl).length;

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    setGenStatus(shot.id, '生成中');
    try {
      const { url, prompt } = await generateShotKeyframe(shot, characters);
      setKeyframe(shot.id, url);
      setPrompt(shot.id, prompt);
    } catch (e) {
      setGenStatus(shot.id, '失败');
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="scrollbar-thin max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] text-neutral-500">
              镜号 {shot.number} · {shot.shotSize} · {shot.duration}s ·{' '}
              {shot.genMethod}
            </div>
            <h2 className="mt-1 text-base font-semibold text-neutral-100">
              {shot.description}
            </h2>
            <div className="mt-1 text-[11px] text-neutral-500">
              涉及角色：{involved.map((c) => c.name).join('、') || '无'}
              {involved.length > 0 && (
                <span className="ml-2 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px]">
                  参考图已就绪 {refsReady}/{involved.length}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-[11px]">
          {shot.narration && (
            <div>
              <div className="uppercase tracking-wide text-neutral-500">
                旁白
              </div>
              <div className="mt-0.5 text-neutral-300">{shot.narration}</div>
            </div>
          )}
          {shot.dialogue && (
            <div>
              <div className="uppercase tracking-wide text-neutral-500">
                对白
              </div>
              <div className="mt-0.5 text-neutral-300">{shot.dialogue}</div>
            </div>
          )}
          {shot.audioNotes && (
            <div>
              <div className="uppercase tracking-wide text-neutral-500">
                声音
              </div>
              <div className="mt-0.5 text-neutral-300">{shot.audioNotes}</div>
            </div>
          )}
          {shot.cameraMove && (
            <div>
              <div className="uppercase tracking-wide text-neutral-500">
                运镜
              </div>
              <div className="mt-0.5 text-neutral-300">{shot.cameraMove}</div>
            </div>
          )}
        </div>

        <div className="mb-4">
          {shot.keyframeUrl ? (
            <img
              src={shot.keyframeUrl}
              alt={shot.description}
              className="w-full rounded border border-neutral-800"
            />
          ) : (
            <div className="flex aspect-[9/16] max-h-[480px] items-center justify-center rounded border border-dashed border-neutral-800 bg-neutral-900/40 text-xs text-neutral-500">
              还没生成关键帧
            </div>
          )}
        </div>

        {involved.length > 0 && refsReady < involved.length && (
          <div className="mb-3 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] text-amber-300">
            ⚠️ 有 {involved.length - refsReady} 个角色还没生成一致性参考图，
            本镜头生成的角色外观可能会漂移。建议先在左栏点选角色 → 右栏生成参考图。
          </div>
        )}

        {error && (
          <div className="mb-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-neutral-800 pt-3">
          <span className="text-[11px] text-neutral-500">
            Nano Banana Pro · 9:16 · 1K · 约 20-40 秒
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {generating
              ? '生成中…'
              : shot.keyframeUrl
                ? '重新生成'
                : '生成关键帧'}
          </button>
        </div>

        {shot.prompt && (
          <details className="mt-4 text-[11px]">
            <summary className="cursor-pointer text-neutral-500 hover:text-neutral-300">
              查看生成提示词
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-2 font-mono text-[10px] leading-relaxed text-neutral-400">
              {shot.prompt}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ShotKeyframeModal;
