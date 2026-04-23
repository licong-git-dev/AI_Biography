import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCharacterStore, useChapterStore } from '../stores';
import type { Character, CharacterGroup } from '../types';
import CharacterEditModal from '../features/characters/CharacterEditModal';

const GROUP_ORDER: CharacterGroup[] = ['主角', '家人', '伴侣', '朋友'];

function makeBlankCharacter(): Character {
  const id = `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: '新角色',
    group: '朋友',
    ageStage: '青年',
    ageRange: '',
    positioning: '',
    appearance: [],
    vibe: [],
    outfits: [],
    promptBaseline: '',
    voiceNotes: [],
  };
}

const LeftPanel: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const activeCharacterId = useCharacterStore((s) => s.activeId);
  const setActiveCharacter = useCharacterStore((s) => s.setActive);
  const addCharacter = useCharacterStore((s) => s.add);
  const removeCharacter = useCharacterStore((s) => s.remove);

  const chapterCount = useChapterStore((s) => s.chapters.length);
  const chaptersLoading = useChapterStore((s) => s.loading);
  const chaptersError = useChapterStore((s) => s.error);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const blank = makeBlankCharacter();
    addCharacter(blank);
    setActiveCharacter(blank.id);
    setEditingId(blank.id); // 立刻打开编辑弹窗
  };

  const handleRemove = (id: string, name: string) => {
    if (!confirm(`删除角色「${name}」？\n该角色的参考图和编辑内容都会丢失。`)) {
      return;
    }
    removeCharacter(id);
  };

  return (
    <>
      <div className="p-4 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Project
          </div>
          <div className="text-sm font-semibold">《李聪传》AI 短剧生产工作台</div>
          <div className="text-xs text-neutral-400 mt-1">v0.1 · 全功能</div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-neutral-500">
              角色卡 ({characters.length})
            </span>
            <button
              onClick={handleAdd}
              className="flex items-center gap-0.5 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
              type="button"
              title="添加新角色"
            >
              <Plus size={10} /> 新角色
            </button>
          </div>
          <div className="space-y-3">
            {GROUP_ORDER.map((group) => {
              const items = characters.filter((c) => c.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="text-[10px] uppercase tracking-wide text-neutral-600 mb-1">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((c) => {
                      const active = c.id === activeCharacterId;
                      return (
                        <div
                          key={c.id}
                          className={`group flex items-center rounded text-xs transition ${
                            active
                              ? 'bg-neutral-800 text-neutral-100'
                              : 'hover:bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <button
                            onClick={() =>
                              setActiveCharacter(active ? null : c.id)
                            }
                            className="flex-1 px-2 py-1.5 text-left"
                            type="button"
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                {c.referenceImageUrl && (
                                  <span
                                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                                    title="已生成参考图"
                                  />
                                )}
                                <span>{c.name}</span>
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {c.ageRange}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(c.id, c.name);
                            }}
                            className="mr-1 rounded p-1 text-neutral-600 opacity-0 transition hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                            type="button"
                            title="删除角色"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            素材来源
          </div>
          <div className="text-xs text-neutral-400 space-y-0.5">
            <div>
              书稿章节：
              {chaptersLoading
                ? '加载中…'
                : chaptersError
                  ? <span className="text-red-400">{chaptersError}</span>
                  : `${chapterCount} 章`}
            </div>
            <div>人物圣经：已集成</div>
            <div>样片骨架：1 个（样片 A）</div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            风格设定
          </div>
          <div className="text-xs text-neutral-600 italic">
            留位 · 画风 / 色调 / 镜头语言
          </div>
        </div>
      </div>

      <CharacterEditModal
        characterId={editingId}
        open={editingId !== null}
        onClose={() => setEditingId(null)}
      />
    </>
  );
};

export default LeftPanel;
