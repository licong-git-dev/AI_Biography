import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  BookMarked,
  Film,
  Image as ImageIcon,
  Search,
  Tv,
  UserCircle,
  X,
} from 'lucide-react';
import {
  useChapterStore,
  useCharacterStore,
  useEpisodeStore,
  useLibraryStore,
  useShotStore,
  useUIStore,
} from '../stores';
import { useEscapeKey } from './useEscapeKey';

type ResultKind =
  | 'character'
  | 'episode'
  | 'shot'
  | 'chapter'
  | 'hook'
  | 'style';

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  /** 跳转动作 */
  jump: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const KIND_LABEL: Record<ResultKind, string> = {
  character: '角色',
  episode: '集数',
  shot: '镜头',
  chapter: '章节',
  hook: '金句',
  style: '风格模板',
};

const KIND_ICON: Record<ResultKind, React.ReactNode> = {
  character: <UserCircle size={11} />,
  episode: <Tv size={11} />,
  shot: <Film size={11} />,
  chapter: <BookOpen size={11} />,
  hook: <BookMarked size={11} />,
  style: <ImageIcon size={11} />,
};

const GlobalSearchModal: React.FC<Props> = ({ open, onClose }) => {
  const characters = useCharacterStore((s) => s.characters);
  const setActiveCharacter = useCharacterStore((s) => s.setActive);
  const episodes = useEpisodeStore((s) => s.episodes);
  const setActiveEpisode = useEpisodeStore((s) => s.setActive);
  const shots = useShotStore((s) => s.shots);
  const chapters = useChapterStore((s) => s.chapters);
  const hooks = useLibraryStore((s) => s.hooks);
  const styles = useLibraryStore((s) => s.styles);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    for (const c of characters) {
      const hay =
        `${c.name} ${c.group} ${c.ageRange} ${c.positioning} ${c.vibe.join(' ')} ${c.outfits.join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          kind: 'character',
          id: c.id,
          title: c.name,
          subtitle: `${c.group} · ${c.ageStage} · ${c.ageRange}`,
          jump: () => {
            setActiveCharacter(c.id);
            onClose();
          },
        });
      }
    }

    for (const e of episodes) {
      const hay =
        `${e.title} ${e.mainConflict} ${e.hook ?? ''} ${e.climax ?? ''} ${e.suspense ?? ''} ${e.memoryPoints.join(' ')} ${e.platformSellingPoint}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          kind: 'episode',
          id: e.id,
          title: `EP${String(e.episodeNumber).padStart(2, '0')}《${e.title}》`,
          subtitle: e.mainConflict,
          jump: () => {
            setActiveEpisode(e.id);
            setCenterTab('episodes');
            onClose();
          },
        });
      }
    }

    for (const s of shots) {
      const hay =
        `${s.number} ${s.shotSize} ${s.description} ${s.narration ?? ''} ${s.dialogue ?? ''} ${s.audioNotes}`.toLowerCase();
      if (hay.includes(q)) {
        const ep = episodes.find((e) => e.id === s.episodeId);
        out.push({
          kind: 'shot',
          id: s.id,
          title: `${s.number} · ${s.shotSize} · ${s.duration}s`,
          subtitle: `${ep ? `EP${String(ep.episodeNumber).padStart(2, '0')} · ` : ''}${s.description}`,
          jump: () => {
            if (ep) setActiveEpisode(ep.id);
            setCenterTab('shots');
            onClose();
          },
        });
      }
    }

    for (const ch of chapters) {
      const hay = `${ch.title} ${ch.content}`.toLowerCase();
      if (hay.includes(q)) {
        // 找出第一个命中位置的上下文片段
        const idx = ch.content.toLowerCase().indexOf(q);
        const snippet =
          idx >= 0
            ? ch.content
                .slice(Math.max(0, idx - 15), idx + Math.min(50, q.length + 30))
                .replace(/\s+/g, ' ')
            : '';
        out.push({
          kind: 'chapter',
          id: ch.id,
          title: `第 ${ch.number} 章《${ch.title}》`,
          subtitle: snippet ? `…${snippet}…` : `${ch.wordCount} 字`,
          jump: () => {
            setCenterTab('chapters');
            onClose();
          },
        });
      }
    }

    for (const h of hooks) {
      const hay = `${h.text} ${h.style ?? ''} ${h.why ?? ''}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          kind: 'hook',
          id: h.id,
          title: h.text,
          subtitle: `${h.style ?? ''} · ${h.why ?? ''}`,
          jump: () => {
            // 资产库需要从 Header 打开，这里只是关闭
            onClose();
          },
        });
      }
    }

    for (const st of styles) {
      const hay = `${st.name} ${st.prompt}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          kind: 'style',
          id: st.id,
          title: st.name,
          subtitle: st.prompt.slice(0, 50),
          jump: () => onClose(),
        });
      }
    }

    return out.slice(0, 50);
  }, [
    query,
    characters,
    episodes,
    shots,
    chapters,
    hooks,
    styles,
    setActiveCharacter,
    setActiveEpisode,
    setCenterTab,
    onClose,
  ]);

  const grouped = useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return map;
  }, [results]);

  const flat = results;

  useEffect(() => {
    if (activeIdx >= flat.length) setActiveIdx(Math.max(0, flat.length - 1));
  }, [flat.length, activeIdx]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[activeIdx]?.jump();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
          <Search size={14} className="text-neutral-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="搜角色 / 集 / 镜头 / 章节 / 金句 / 风格…"
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
          />
          <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[9px] text-neutral-500">
            Esc
          </kbd>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            <X size={12} />
          </button>
        </div>

        <div
          ref={listRef}
          className="scrollbar-thin max-h-[60vh] overflow-y-auto"
        >
          {!query.trim() ? (
            <div className="p-6 text-center text-[11px] text-neutral-500">
              <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              {' '}选择 ·{' '}
              <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>
              {' '}跳转 ·{' '}
              <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              {' '}关闭
            </div>
          ) : flat.length === 0 ? (
            <div className="p-6 text-center text-[11px] text-neutral-500">
              没有匹配「{query}」的结果
            </div>
          ) : (
            <div className="py-1">
              {Array.from(grouped.entries()).map(([kind, items]) => (
                <div key={kind}>
                  <div className="flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
                    {KIND_ICON[kind]}
                    <span>
                      {KIND_LABEL[kind]}（{items.length}）
                    </span>
                  </div>
                  {items.map((r) => {
                    const idx = flat.indexOf(r);
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={`${kind}-${r.id}`}
                        onClick={() => r.jump()}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`block w-full px-3 py-1.5 text-left transition ${
                          active ? 'bg-neutral-900' : 'hover:bg-neutral-900/60'
                        }`}
                        type="button"
                      >
                        <div className="text-xs text-neutral-100">
                          {r.title}
                        </div>
                        <div className="truncate text-[10px] text-neutral-500">
                          {r.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="px-3 py-1 text-[10px] text-neutral-600">
                共 {flat.length} 条
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
