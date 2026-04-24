import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import {
  checkSeasonConsistency,
  type ConsistencyIssue,
  type IssueSeverity,
} from './consistencyService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useFocusTrap } from '../../components/useFocusTrap';
import Spinner from '../../components/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  high: 'border-red-800 bg-red-950/30 text-red-200',
  medium: 'border-amber-800 bg-amber-950/30 text-amber-200',
  low: 'border-neutral-700 bg-neutral-900/60 text-neutral-300',
};

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const ConsistencyModal: React.FC<Props> = ({ open, onClose }) => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const characters = useCharacterStore((s) => s.characters);
  const shots = useShotStore((s) => s.shots);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  const [issues, setIssues] = useState<ConsistencyIssue[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(open, onClose);
  useFocusTrap(open, containerRef);

  const runCheck = async () => {
    setError(null);
    setIssues(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await checkSeasonConsistency({
        episodes,
        characters,
        shots,
        signal: controller.signal,
      });
      setIssues(result);
    } catch (e) {
      if (isAbortError(e)) setError('已取消');
      else if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-sky-300" />
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                跨集一致性检查
              </h2>
              <div className="mt-0.5 text-[11px] text-neutral-500">
                扫描 {episodes.length} 集 / {characters.length} 角色 / {shots.length} 镜头，
                找角色矛盾 / 时间线 / 伏笔失衡 / 情绪曲线 / 节奏
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={runCheck}
            disabled={running || episodes.length === 0}
            className="flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {running && <Spinner size={12} />}
            {running ? '检查中…（约 30-60 秒）' : issues ? '重新检查' : '开始检查'}
          </button>
          {running && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded border border-red-800 bg-red-950/30 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-700"
              type="button"
            >
              取消
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {issues !== null && !running && (
          <div>
            {issues.length === 0 ? (
              <div className="flex items-center gap-2 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                <CheckCircle2 size={14} />
                AI 没检出明显矛盾。但这不能替代人工终审。
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] text-neutral-400">
                  发现 {issues.length} 个问题，按严重度排序：
                </div>
                {issues
                  .slice()
                  .sort(
                    (a, b) =>
                      severityRank(a.severity) - severityRank(b.severity)
                  )
                  .map((issue, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${SEVERITY_COLOR[issue.severity]}`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-[11px]">
                        <AlertTriangle size={11} />
                        <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono">
                          {SEVERITY_LABEL[issue.severity]}
                        </span>
                        <span className="rounded bg-black/30 px-1.5 py-0.5">
                          {issue.category}
                        </span>
                        <span className="text-[10px] opacity-70">
                          涉及：{issue.affectedEpisodes.join(' · ')}
                        </span>
                      </div>
                      <div className="text-xs leading-relaxed">
                        {issue.description}
                      </div>
                      {issue.suggestion && (
                        <div className="mt-1.5 border-t border-white/10 pt-1.5 text-[11px] opacity-90">
                          💡 {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {issues === null && !running && !error && (
          <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center text-xs text-neutral-500">
            点「开始检查」让 AI 审阅全季
          </div>
        )}
      </div>
    </div>
  );
};

function severityRank(s: IssueSeverity): number {
  return s === 'high' ? 0 : s === 'medium' ? 1 : 2;
}

export default ConsistencyModal;
