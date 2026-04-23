import React from 'react';
import { useCharacterStore, useChapterStore } from '../stores';
import type { CharacterGroup } from '../types';

const GROUP_ORDER: CharacterGroup[] = ['主角', '家人', '伴侣', '朋友'];

const LeftPanel: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const activeCharacterId = useCharacterStore((s) => s.activeId);
  const setActiveCharacter = useCharacterStore((s) => s.setActive);

  const chapterCount = useChapterStore((s) => s.chapters.length);
  const chaptersLoading = useChapterStore((s) => s.loading);
  const chaptersError = useChapterStore((s) => s.error);

  return (
    <div className="p-4 space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Project
        </div>
        <div className="text-sm font-semibold">《李聪传》AI 短剧生产工作台</div>
        <div className="text-xs text-neutral-400 mt-1">v0.1 · Phase 1 数据层</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          角色卡 ({characters.length})
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
                      <button
                        key={c.id}
                        onClick={() =>
                          setActiveCharacter(active ? null : c.id)
                        }
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition ${
                          active
                            ? 'bg-neutral-800 text-neutral-100'
                            : 'hover:bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
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
          Phase 2 填充 · 画风 / 色调 / 镜头语言
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
