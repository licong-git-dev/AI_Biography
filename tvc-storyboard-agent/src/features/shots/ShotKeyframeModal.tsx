import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useCharacterStore, useShotStore, useUIStore } from '../../stores';
import { generateShotKeyframe } from './shotService';
import { generateShotVideo } from '../video/videoService';
import { generateSpeech, extractSpeechText } from '../audio/voiceService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import Spinner from '../../components/Spinner';
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
  const characters = useCharacterStore((s) => s.characters);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState('Kore');
  const [editOpen, setEditOpen] = useState(false);

  // 只在内层 ShotEditModal 未开时响应 Esc，避免同时关两层
  useEscapeKey(Boolean(shotId) && Boolean(shot) && !editOpen, onClose);

  if (!shotId || !shot) return null;

  const involved = characters.filter((c) => shot.characters.includes(c.id));
  const refsReady = involved.filter((c) => c.referenceImageUrl).length;
  const speechText = extractSpeechText(shot);

  const handleGenerateImage = async () => {
    setError(null);
    setGeneratingImage(true);
    setGenStatus(shot.id, '生成中');
    try {
      const { url, prompt } = await generateShotKeyframe(shot, characters);
      setKeyframe(shot.id, url);
      setPrompt(shot.id, prompt);
    } catch (e) {
      setGenStatus(shot.id, '失败');
      handleError(e);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!shot.keyframeUrl) return;
    setError(null);
    setGeneratingVideo(true);
    setVideoGenStatus(shot.id, '生成中');
    try {
      const { url, prompt } = await generateShotVideo(shot);
      setVideo(shot.id, url, prompt);
    } catch (e) {
      setVideoGenStatus(shot.id, '失败');
      handleError(e);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!speechText) return;
    setError(null);
    setGeneratingVoice(true);
    setVoiceGenStatus(shot.id, '生成中');
    try {
      const url = await generateSpeech(speechText, speaker);
      setVoice(shot.id, url, speaker);
    } catch (e) {
      setVoiceGenStatus(shot.id, '失败');
      handleError(e);
    } finally {
      setGeneratingVoice(false);
    }
  };

  const handleError = (e: unknown) => {
    if (e instanceof ApiKeyMissingError) {
      setError(e.message);
      openApiKey();
    } else {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const anyRunning = generatingImage || generatingVideo || generatingVoice;

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
              className="w-full rounded border border-neutral-800"
            />
          ) : (
            <Placeholder label="还没生成关键帧" />
          )}

          {involved.length > 0 && refsReady < involved.length && (
            <div className="mt-2 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] text-amber-300">
              ⚠️ 有 {involved.length - refsReady} 个角色还没生成一致性参考图，
              本镜头生成的角色外观可能会漂移。
            </div>
          )}

          <div className="mt-3 flex justify-end">
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

          <div className="mt-3 flex justify-end">
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
