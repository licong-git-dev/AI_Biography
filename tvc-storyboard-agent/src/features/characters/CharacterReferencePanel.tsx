import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import type { Character } from '../../types';
import { useCharacterStore, useUIStore } from '../../stores';
import { generateCharacterReference } from './characterService';
import { ApiKeyMissingError } from '../../services/geminiClient';
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

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const url = await generateCharacterReference(character);
      setReferenceImage(character.id, url);
      toast.success(`${character.name}：参考图已生成`);
    } catch (e) {
      if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

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
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full rounded border border-neutral-800 py-1.5 text-[11px] text-neutral-300 hover:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generating ? '生成中…（约 20-40 秒）' : '重新生成'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded border border-sky-800 bg-sky-900/30 py-2 text-xs font-medium text-sky-200 hover:border-sky-700 hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {generating
              ? '生成中…（约 20-40 秒）'
              : '生成 6 视图参考图（Nano Banana Pro）'}
          </button>
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

export default CharacterReferencePanel;
