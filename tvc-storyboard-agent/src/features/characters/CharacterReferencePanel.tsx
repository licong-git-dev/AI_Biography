import React, { useMemo, useRef, useState } from 'react';
import { BarChart3, Copy } from 'lucide-react';
import type { Character } from '../../types';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import { generateCharacterReference } from './characterService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import { toast } from '../../stores/toastStore';

interface Props {
  character: Character;
  onEdit: () => void;
}

const CharacterReferencePanel: React.FC<Props> = ({ character, onEdit }) => {
  const setReferenceImage = useCharacterStore((s) => s.setReferenceImage);
  const addCharacter = useCharacterStore((s) => s.add);
  const setActiveCharacter = useCharacterStore((s) => s.setActive);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);

  const handleDuplicate = () => {
    const copy: Character = {
      ...character,
      id: `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${character.name}（副本）`,
      referenceImageUrl: undefined, // 副本不继承已生成的参考图，省 localStorage
    };
    addCharacter(copy);
    setActiveCharacter(copy.id);
    toast.success(`已复制为「${copy.name}」，可在左栏编辑`);
  };

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const url = await generateCharacterReference(character, controller.signal);
      setReferenceImage(character.id, url);
      toast.success(`${character.name}：参考图已生成`);
    } catch (e) {
      if (isAbortError(e)) {
        setError('已取消');
      } else if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              {character.group} · {character.ageStage}
            </div>
            <div className="mt-0.5 text-sm font-semibold">
              {character.name}
            </div>
            <div className="text-[11px] text-neutral-500">
              {character.ageRange}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-0.5 rounded border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300 hover:border-neutral-700"
              type="button"
              title="用本角色作模板，创建一个新的角色"
            >
              <Copy size={10} /> 复制
            </button>
            <button
              onClick={onEdit}
              className="rounded border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300 hover:border-neutral-700"
              type="button"
            >
              编辑
            </button>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-neutral-300">
          {character.positioning}
        </p>
      </div>

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
          气质
        </div>
        <div className="flex flex-wrap gap-1">
          {character.vibe.map((v) => (
            <span
              key={v}
              className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      <CharacterScreenTime characterId={character.id} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">
            一致性参考图
          </span>
          {character.referenceImageUrl && (
            <button
              onClick={() => resetCharacter(character.id)}
              className="text-[10px] text-neutral-500 hover:text-neutral-300"
              type="button"
              title="恢复到 SEED 默认（清除编辑 + 参考图）"
            >
              重置角色
            </button>
          )}
        </div>

        {character.referenceImageUrl ? (
          <div className="space-y-2">
            <img
              src={character.referenceImageUrl}
              alt={character.name}
              className="w-full rounded border border-neutral-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 rounded border border-neutral-800 py-1.5 text-[11px] text-neutral-300 hover:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {generating ? '生成中…（约 20-40 秒）' : '重新生成'}
              </button>
              {generating && (
                <button
                  onClick={handleCancel}
                  className="rounded border border-red-800 bg-red-950/30 px-2 text-[11px] text-red-300 hover:border-red-700"
                  type="button"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 rounded border border-sky-800 bg-sky-900/30 py-2 text-xs font-medium text-sky-200 hover:border-sky-700 hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generating
                ? '生成中…（约 20-40 秒）'
                : '生成 6 视图参考图（Nano Banana Pro）'}
            </button>
            {generating && (
              <button
                onClick={handleCancel}
                className="rounded border border-red-800 bg-red-950/30 px-3 text-xs text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {!character.referenceImageUrl && !error && (
          <div className="mt-2 text-[10px] text-neutral-600">
            会根据角色的外观基线、气质、服装组生成 2×3 宫格参考图，
            用于后续镜头生成保持角色一致性。
          </div>
        )}
      </div>
    </div>
  );
};

const CharacterScreenTime: React.FC<{ characterId: string }> = ({
  characterId,
}) => {
  const shots = useShotStore((s) => s.shots);
  const episodes = useEpisodeStore((s) => s.episodes);

  const stats = useMemo(() => {
    const involvedShots = shots.filter((s) =>
      s.characters.includes(characterId)
    );
    const episodeIds = new Set(involvedShots.map((s) => s.episodeId));
    const totalSeconds = involvedShots.reduce((a, s) => a + s.duration, 0);
    const involvedEpisodes = episodes
      .filter((e) => episodeIds.has(e.id))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
    return {
      shotCount: involvedShots.length,
      episodeCount: episodeIds.size,
      totalSeconds,
      involvedEpisodes,
    };
  }, [shots, episodes, characterId]);

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-500">
        <BarChart3 size={10} /> 戏份统计
      </div>
      {stats.shotCount === 0 ? (
        <div className="rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[10px] text-amber-300">
          ⚠️ 该角色在所有镜头里都没出场。可能是孤儿角色卡，可考虑删除或检查
          ID 引用。
        </div>
      ) : (
        <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
          <div className="flex items-baseline gap-3 text-[11px]">
            <span>
              <span className="font-semibold text-neutral-100">
                {stats.episodeCount}
              </span>
              <span className="ml-0.5 text-neutral-500">集</span>
            </span>
            <span>
              <span className="font-semibold text-neutral-100">
                {stats.shotCount}
              </span>
              <span className="ml-0.5 text-neutral-500">镜头</span>
            </span>
            <span>
              <span className="font-semibold text-neutral-100">
                ~{stats.totalSeconds}
              </span>
              <span className="ml-0.5 text-neutral-500">秒</span>
            </span>
          </div>
          {stats.involvedEpisodes.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {stats.involvedEpisodes.map((e) => (
                <span
                  key={e.id}
                  className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[9px] text-neutral-300"
                  title={`《${e.title}》`}
                >
                  EP{String(e.episodeNumber).padStart(2, '0')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterReferencePanel;
