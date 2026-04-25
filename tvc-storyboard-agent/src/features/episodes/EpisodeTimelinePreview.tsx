import React, { useEffect, useRef, useState } from 'react';
import { Film, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { Episode } from '../../types';
import { useShotStore, useCharacterStore } from '../../stores';

interface Props {
  episode: Episode;
}

/**
 * 把一集的所有镜头做成缩略图时间线，可以"粗剪预览"：
 * - 每个镜头显示缩略图 + 镜号 + 时长 + 累计秒数
 * - 点「播放」按镜头时长依次高亮，有配音时同步播放（拼接式，逐个播）
 * - 看出情绪曲线 + 节奏 + 资产缺口（灰格子就是缺关键帧）
 */
const EpisodeTimelinePreview: React.FC<Props> = ({ episode }) => {
  const allShots = useShotStore((s) => s.shots);
  const getCharacter = useCharacterStore((s) => s.getById);
  const shots = allShots.filter((s) => s.episodeId === episode.id);

  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalDuration = shots.reduce((a, s) => a + s.duration, 0);
  const progressDuration = shots
    .slice(0, Math.max(activeIdx + 1, 0))
    .reduce((a, s) => a + s.duration, 0);

  const stop = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  };

  const playFrom = (startIdx: number) => {
    if (shots.length === 0) return;
    stop();
    setPlaying(true);
    setActiveIdx(startIdx);

    const step = (idx: number) => {
      if (idx >= shots.length) {
        setPlaying(false);
        setActiveIdx(-1);
        return;
      }
      setActiveIdx(idx);
      const shot = shots[idx]!;
      // 滚动到可见区
      scrollRef.current?.querySelector<HTMLElement>(
        `[data-shot-idx="${idx}"]`
      )?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      // 播放配音（若有）
      if (shot.voiceUrl) {
        const audio = new Audio(shot.voiceUrl);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }

      timerRef.current = window.setTimeout(
        () => step(idx + 1),
        Math.max(1000, shot.duration * 1000)
      );
    };

    step(startIdx);
  };

  useEffect(() => () => stop(), []);

  if (shots.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-neutral-800 bg-neutral-900/30 p-4 text-center text-[11px] text-neutral-500">
        本集暂无镜头，无法预览时间线。
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <Film size={12} /> 时间线预览
          <span className="text-[10px] text-neutral-500">
            {progressDuration}s / {totalDuration}s · {shots.length} 镜
          </span>
        </span>
        <div className="flex gap-1">
          {playing ? (
            <button
              onClick={stop}
              className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-100 hover:bg-neutral-700"
              type="button"
            >
              <Pause size={9} /> 暂停
            </button>
          ) : (
            <button
              onClick={() => playFrom(0)}
              className="flex items-center gap-1 rounded bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-sky-500"
              type="button"
            >
              <Play size={9} /> 粗剪预览
            </button>
          )}
          {activeIdx > 0 && !playing && (
            <button
              onClick={() => setActiveIdx(-1)}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
              type="button"
              title="回到开头"
            >
              <RotateCcw size={9} />
            </button>
          )}
        </div>
      </div>

      {/* 累计进度条 */}
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{
            width:
              totalDuration > 0
                ? `${(progressDuration / totalDuration) * 100}%`
                : '0%',
          }}
        />
      </div>

      {/* 时间线 */}
      <div
        ref={scrollRef}
        className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1"
      >
        {shots.map((shot, idx) => {
          const active = idx === activeIdx;
          const cumUntilEnd = shots
            .slice(0, idx + 1)
            .reduce((a, s) => a + s.duration, 0);
          const charNames = shot.characters
            .map((id) => getCharacter(id)?.name ?? id)
            .slice(0, 2)
            .join('、');

          return (
            <button
              key={shot.id}
              data-shot-idx={idx}
              onClick={() => {
                stop();
                setActiveIdx(idx);
              }}
              onDoubleClick={() => playFrom(idx)}
              className={`shrink-0 rounded border text-left transition ${
                active
                  ? 'border-sky-500 ring-1 ring-sky-500/50'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
              style={{ width: '100px' }}
              type="button"
              title={`双击从此处开始播放\n${shot.description}`}
            >
              {shot.keyframeUrl ? (
                <div className="relative">
                  <img
                    src={shot.keyframeUrl}
                    alt={shot.number}
                    className="h-20 w-full object-cover"
                  />
                  {shot.voiceUrl && (
                    <Volume2
                      size={9}
                      className="absolute bottom-0.5 right-0.5 rounded bg-black/70 p-0.5 text-amber-300"
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center bg-neutral-900 text-[10px] text-neutral-600">
                  缺关键帧
                </div>
              )}
              <div className="bg-neutral-950/80 px-1 py-0.5 text-[9px]">
                <div className="flex justify-between font-mono text-neutral-400">
                  <span>{shot.number}</span>
                  <span>{shot.duration}s</span>
                </div>
                <div className="mt-0.5 truncate text-neutral-500">
                  {charNames || shot.shotSize}
                </div>
                <div className="font-mono text-[8px] text-neutral-600">
                  @{cumUntilEnd}s
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-1.5 text-[9px] text-neutral-600">
        点镜头选中；双击从此处开始播放；有配音的镜头播放时自动同步音频。
      </p>
    </div>
  );
};

export default EpisodeTimelinePreview;
