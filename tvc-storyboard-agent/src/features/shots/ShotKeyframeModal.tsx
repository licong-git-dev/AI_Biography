import React, { useRef, useState } from 'react';
import { BookmarkPlus, Download, Pencil } from 'lucide-react';
import {
  useCharacterStore,
  useLibraryStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import { toast } from '../../stores/toastStore';
import { generateShotKeyframe } from './shotService';
import { generateShotVideo } from '../video/videoService';
import {
  generateSpeech,
  extractSpeechText,
  transcribeAudio,
} from '../audio/voiceService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import Spinner from '../../components/Spinner';
import { useFocusTrap } from '../../components/useFocusTrap';
import { useEscapeKey } from '../../components/useEscapeKey';
import ShotEditModal from './ShotEditModal';

interface Props {
  shotId: string | null;
  onClose: () => void;
}

const SPEAKERS = [
  { id: 'Kore', label: 'Kore · 稳重女声' },
  { id: 'Puck', label: 'Puck · 少年男声' },
  { id: 'Charon', label: 'Charon · 低沉男声' },
  { id: 'Aoede', label: 'Aoede · 清亮女声' },
];

const ShotKeyframeModal: React.FC<Props> = ({ shotId, onClose }) => {
  const shot = useShotStore((s) => (shotId ? s.getById(shotId) : undefined));
  const setKeyframe = useShotStore((s) => s.setKeyframe);
  const setGenStatus = useShotStore((s) => s.setGenStatus);
  const setPrompt = useShotStore((s) => s.setPrompt);
  const setVideo = useShotStore((s) => s.setVideo);
  const setVideoGenStatus = useShotStore((s) => s.setVideoGenStatus);
  const setVoice = useShotStore((s) => s.setVoice);
  const setVoiceGenStatus = useShotStore((s) => s.setVoiceGenStatus);
  const setSubtitle = useShotStore((s) => s.setSubtitle);
  const characters = useCharacterStore((s) => s.characters);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const addStyleTemplate = useLibraryStore((s) => s.addStyle);

  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [generatingSrt, setGeneratingSrt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState('Kore');
  const [editOpen, setEditOpen] = useState(false);

  const imgAbortRef = useRef<AbortController | null>(null);
  const vidAbortRef = useRef<AbortController | null>(null);
  const voiceAbortRef = useRef<AbortController | null>(null);
  const srtAbortRef = useRef<AbortController | null>(null);

  const [styleNameInput, setStyleNameInput] = useState<string | null>(null);

  // 只在内层 ShotEditModal 未开时响应 Esc，避免同时关两层
  useEscapeKey(Boolean(shotId) && Boolean(shot) && !editOpen, onClose);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(
    Boolean(shotId) && Boolean(shot) && !editOpen,
    containerRef
  );

  if (!shotId || !shot) return null;

  const involved = characters.filter((c) => shot.characters.includes(c.id));
  const refsReady = involved.filter((c) => c.referenceImageUrl).length;
  const speechText = extractSpeechText(shot);

  const handleGenerateImage = async () => {
    setError(null);
    setGeneratingImage(true);
    setGenStatus(shot.id, '生成中');
    const controller = new AbortController();
    imgAbortRef.current = controller;
    try {
      const { url, prompt } = await generateShotKeyframe(
        shot,
        characters,
        controller.signal
      );
      setKeyframe(shot.id, url);
      setPrompt(shot.id, prompt);
    } catch (e) {
      if (isAbortError(e)) {
        setGenStatus(shot.id, shot.keyframeUrl ? '已生成' : '未生成');
        setError('关键帧生成已取消');
      } else {
        setGenStatus(shot.id, '失败');
        handleError(e);
      }
    } finally {
      setGeneratingImage(false);
      imgAbortRef.current = null;
    }
  };

  const handleGenerateVideo = async () => {
    if (!shot.keyframeUrl) return;
    setError(null);
    setGeneratingVideo(true);
    setVideoGenStatus(shot.id, '生成中');
    const controller = new AbortController();
    vidAbortRef.current = controller;
    try {
      const { url, prompt } = await generateShotVideo(shot, controller.signal);
      setVideo(shot.id, url, prompt);
    } catch (e) {
      if (isAbortError(e)) {
        setVideoGenStatus(shot.id, shot.videoUrl ? '已生成' : '未生成');
        setError('视频生成已取消');
      } else {
        setVideoGenStatus(shot.id, '失败');
        handleError(e);
      }
    } finally {
      setGeneratingVideo(false);
      vidAbortRef.current = null;
    }
  };

  const handleGenerateVoice = async () => {
    if (!speechText) return;
    setError(null);
    setGeneratingVoice(true);
    setVoiceGenStatus(shot.id, '生成中');
    const controller = new AbortController();
    voiceAbortRef.current = controller;
    try {
      const url = await generateSpeech(speechText, speaker, controller.signal);
      setVoice(shot.id, url, speaker);
    } catch (e) {
      if (isAbortError(e)) {
        setVoiceGenStatus(shot.id, shot.voiceUrl ? '已生成' : '未生成');
        setError('配音合成已取消');
      } else {
        setVoiceGenStatus(shot.id, '失败');
        handleError(e);
      }
    } finally {
      setGeneratingVoice(false);
      voiceAbortRef.current = null;
    }
  };

  const handleGenerateSrt = async () => {
    if (!shot.voiceUrl) return;
    setError(null);
    setGeneratingSrt(true);
    const controller = new AbortController();
    srtAbortRef.current = controller;
    try {
      const srt = await transcribeAudio(shot.voiceUrl, controller.signal);
      setSubtitle(shot.id, srt);
    } catch (e) {
      if (isAbortError(e)) setError('字幕转写已取消');
      else handleError(e);
    } finally {
      setGeneratingSrt(false);
      srtAbortRef.current = null;
    }
  };

  const cancelImg = () => imgAbortRef.current?.abort();
  const cancelVid = () => vidAbortRef.current?.abort();
  const cancelVoice = () => voiceAbortRef.current?.abort();
  const cancelSrt = () => srtAbortRef.current?.abort();

  const handleDownloadSrt = () => {
    if (!shot.subtitleSrt) return;
    const blob = new Blob([shot.subtitleSrt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shot-${shot.number.replace(/[\\/:*?"<>|]/g, '_')}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleError = (e: unknown) => {
    if (e instanceof ApiKeyMissingError) {
      setError(e.message);
      openApiKey();
    } else {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const anyRunning =
    generatingImage || generatingVideo || generatingVoice || generatingSrt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
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
                  参考图就绪 {refsReady}/{involved.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
              type="button"
              title="编辑镜头信息"
            >
              <Pencil size={11} /> 编辑
            </button>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-300"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-[11px]">
          {shot.narration && (
            <Row label="旁白" value={shot.narration} />
          )}
          {shot.dialogue && (
            <Row label="对白" value={shot.dialogue} />
          )}
          {shot.audioNotes && (
            <Row label="声音" value={shot.audioNotes} />
          )}
          {shot.cameraMove && (
            <Row label="运镜" value={shot.cameraMove} />
          )}
        </div>

        {/* 关键帧 */}
        <Section
          title="关键帧"
          subtitle="Nano Banana Pro · 9:16 · 1K · 约 20-40 秒"
        >
          {shot.keyframeUrl ? (
            <img
              src={shot.keyframeUrl}
              alt={shot.description}
              className={`w-full rounded border ${
                shot.keyframeStale
                  ? 'border-amber-700'
                  : 'border-neutral-800'
              }`}
            />
          ) : (
            <Placeholder label="还没生成关键帧" />
          )}

          {shot.keyframeStale && shot.keyframeUrl && (
            <div className="mt-2 rounded border border-amber-700 bg-amber-950/30 p-2 text-[11px] text-amber-200">
              ⚠️ 镜头信息（画面 / 景别 / 运镜 / 角色）有更新，当前关键帧
              已过时。建议重新生成。
            </div>
          )}

          {involved.length > 0 && refsReady < involved.length && (
            <div className="mt-2 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] text-amber-300">
              ⚠️ 有 {involved.length - refsReady} 个角色还没生成一致性参考图，
              本镜头生成的角色外观可能会漂移。
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            {shot.keyframeUrl && shot.prompt && !generatingImage && (
              <button
                onClick={() =>
                  setStyleNameInput(`镜 ${shot.number} · ${shot.shotSize}`)
                }
                className="flex items-center gap-1 rounded border border-amber-800 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300 hover:border-amber-700"
                type="button"
                title="把当前关键帧的 prompt + 缩略图存到资产库，未来可复用"
              >
                <BookmarkPlus size={11} /> 保存风格
              </button>
            )}
            {generatingImage && (
              <button
                onClick={cancelImg}
                className="rounded border border-red-800 bg-red-950/30 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
            <button
              onClick={handleGenerateImage}
              disabled={anyRunning}
              className="flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generatingImage && <Spinner size={12} />}
              {generatingImage
                ? '生成中…'
                : shot.keyframeUrl
                  ? '重新生成关键帧'
                  : '生成关键帧'}
            </button>
          </div>
        </Section>

        {/* 视频（图生视频，基于关键帧） */}
        <Section
          title="视频片段"
          subtitle={`Veo 3 · 图生视频 · 约 ${Math.min(Math.max(shot.duration, 3), 8)} 秒 · 可能需几分钟`}
        >
          {shot.videoUrl ? (
            <video
              src={shot.videoUrl}
              controls
              className="w-full rounded border border-neutral-800"
            />
          ) : (
            <Placeholder
              label={
                shot.keyframeUrl
                  ? '还没生成视频'
                  : '先生成关键帧才能做图生视频'
              }
            />
          )}

          <div className="mt-3 flex justify-end gap-2">
            {generatingVideo && (
              <button
                onClick={cancelVid}
                className="rounded border border-red-800 bg-red-950/30 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
            <button
              onClick={handleGenerateVideo}
              disabled={anyRunning || !shot.keyframeUrl}
              className="flex items-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generatingVideo && <Spinner size={12} />}
              {generatingVideo
                ? '生成中（轮询）…'
                : shot.videoUrl
                  ? '重新生成视频'
                  : '生成视频'}
            </button>
          </div>
        </Section>

        {/* 旁白 / 配音 */}
        <Section
          title="旁白 / 配音"
          subtitle={
            speechText
              ? 'Gemini TTS · 中文合成'
              : '本镜头没有旁白或对白文本'
          }
        >
          {speechText && (
            <div className="mb-2 rounded bg-neutral-900/60 p-2 text-[11px] text-neutral-300">
              待合成文本：{speechText}
            </div>
          )}

          {shot.voiceUrl && (
            <audio
              src={shot.voiceUrl}
              controls
              className="w-full"
            />
          )}

          {speechText && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <label className="text-[11px] text-neutral-400">声线</label>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                disabled={anyRunning}
                className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100"
              >
                {SPEAKERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {generatingVoice && (
                <button
                  onClick={cancelVoice}
                  className="rounded border border-red-800 bg-red-950/30 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-700"
                  type="button"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleGenerateVoice}
                disabled={anyRunning}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {generatingVoice && <Spinner size={12} />}
                {generatingVoice
                  ? '合成中…'
                  : shot.voiceUrl
                    ? '重新合成'
                    : '合成旁白'}
              </button>
            </div>
          )}

          {/* SRT 字幕 */}
          {shot.voiceUrl && (
            <div className="mt-4 border-t border-neutral-800/60 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-300">
                  字幕（SRT）
                </span>
                <div className="flex gap-2">
                  {shot.subtitleSrt && (
                    <button
                      onClick={handleDownloadSrt}
                      className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 hover:border-neutral-700"
                      type="button"
                    >
                      <Download size={10} /> 下载 .srt
                    </button>
                  )}
                  {generatingSrt && (
                    <button
                      onClick={cancelSrt}
                      className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-300 hover:border-red-700"
                      type="button"
                    >
                      取消
                    </button>
                  )}
                  <button
                    onClick={handleGenerateSrt}
                    disabled={anyRunning}
                    className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                  >
                    {generatingSrt && <Spinner size={9} />}
                    {generatingSrt
                      ? '转写中…'
                      : shot.subtitleSrt
                        ? '重新转写'
                        : '从音频转写 SRT'}
                  </button>
                </div>
              </div>
              {shot.subtitleSrt && (
                <pre className="scrollbar-thin max-h-32 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-2 font-mono text-[10px] leading-relaxed text-neutral-300">
                  {shot.subtitleSrt}
                </pre>
              )}
            </div>
          )}
        </Section>

        {error && (
          <div className="mb-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {shot.prompt && (
          <details className="mt-2 text-[11px]">
            <summary className="cursor-pointer text-neutral-500 hover:text-neutral-300">
              查看图像生成提示词
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-2 font-mono text-[10px] leading-relaxed text-neutral-400">
              {shot.prompt}
            </pre>
          </details>
        )}
      </div>

      <ShotEditModal
        shotId={editOpen ? shot.id : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {styleNameInput !== null && shot.keyframeUrl && shot.prompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setStyleNameInput(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-sm font-semibold text-neutral-100">
              保存风格模板
            </div>
            <div className="mb-3 text-[11px] text-neutral-500">
              把当前关键帧的 prompt + 缩略图存到资产库
            </div>
            <input
              type="text"
              value={styleNameInput}
              onChange={(e) => setStyleNameInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && styleNameInput.trim()) {
                  addStyleTemplate({
                    name: styleNameInput.trim(),
                    prompt: shot.prompt!,
                    thumbnailUrl: shot.keyframeUrl,
                    sourceShotId: shot.id,
                  });
                  toast.success(`已保存：${styleNameInput.trim()}`);
                  setStyleNameInput(null);
                }
              }}
              placeholder="模板名称"
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setStyleNameInput(null)}
                className="rounded border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700"
                type="button"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!styleNameInput.trim()) return;
                  addStyleTemplate({
                    name: styleNameInput.trim(),
                    prompt: shot.prompt!,
                    thumbnailUrl: shot.keyframeUrl,
                    sourceShotId: shot.id,
                  });
                  toast.success(`已保存：${styleNameInput.trim()}`);
                  setStyleNameInput(null);
                }}
                disabled={!styleNameInput.trim()}
                className="rounded bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                type="button"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="uppercase tracking-wide text-neutral-500">{label}</div>
    <div className="mt-0.5 text-neutral-300">{value}</div>
  </div>
);

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="mb-5 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-xs font-medium text-neutral-200">{title}</span>
      {subtitle && (
        <span className="text-[10px] text-neutral-500">{subtitle}</span>
      )}
    </div>
    {children}
  </div>
);

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex aspect-[9/16] max-h-[320px] items-center justify-center rounded border border-dashed border-neutral-800 bg-neutral-900/40 text-xs text-neutral-500">
    {label}
  </div>
);

export default ShotKeyframeModal;
