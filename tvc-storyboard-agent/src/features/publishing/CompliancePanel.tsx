import React, { useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Episode } from '../../types';
import { useShotStore, useUIStore } from '../../stores';
import {
  checkEpisodeCompliance,
  type ComplianceIssue,
  type ComplianceSeverity,
} from './complianceService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import Spinner from '../../components/Spinner';

interface Props {
  episode: Episode;
}

const SEVERITY_COLOR: Record<ComplianceSeverity, string> = {
  block: 'border-red-800 bg-red-950/40 text-red-200',
  warn: 'border-amber-800 bg-amber-950/30 text-amber-200',
  info: 'border-neutral-700 bg-neutral-900/60 text-neutral-300',
};

const SEVERITY_LABEL: Record<ComplianceSeverity, string> = {
  block: '阻断',
  warn: '警告',
  info: '建议',
};

function severityRank(s: ComplianceSeverity): number {
  return s === 'block' ? 0 : s === 'warn' ? 1 : 2;
}

const CompliancePanel: React.FC<Props> = ({ episode }) => {
  const byEpisode = useShotStore((s) => s.byEpisode);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  const [issues, setIssues] = useState<ComplianceIssue[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleCheck = async () => {
    setError(null);
    setIssues(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await checkEpisodeCompliance({
        episode,
        shots: byEpisode(episode.id),
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

  const blockCount = issues?.filter((i) => i.severity === 'block').length ?? 0;

  return (
    <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <ShieldAlert size={12} /> 发布合规预检
        </span>
        <div className="flex items-center gap-1">
          {running && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-300 hover:border-red-700"
              type="button"
            >
              取消
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={running}
            className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {running && <Spinner size={9} />}
            {running ? '检查中…' : issues ? '重新检查' : '开始检查'}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-neutral-500">
        扫描敏感词 / 人名 / 地名 / 版权 / 低俗 / 算法偏好 7 类风险。预防平台限流。
      </div>

      {error && (
        <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[10px] text-red-300">
          {error}
        </div>
      )}

      {issues !== null && !running && (
        <div className="mt-2">
          {issues.length === 0 ? (
            <div className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-[11px] text-emerald-200">
              ✓ 没检出明显合规风险。但这不能替代平台人工审核。
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] text-neutral-400">
                共 {issues.length} 条
                {blockCount > 0 && (
                  <span className="ml-1.5 rounded bg-red-800 px-1 py-0.5 text-[9px] text-red-50">
                    其中 {blockCount} 条阻断
                  </span>
                )}
              </div>
              {issues
                .slice()
                .sort(
                  (a, b) => severityRank(a.severity) - severityRank(b.severity)
                )
                .map((i, idx) => (
                  <div
                    key={idx}
                    className={`rounded border p-2 text-[11px] ${SEVERITY_COLOR[i.severity]}`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded bg-black/30 px-1 py-0.5 text-[9px] font-mono">
                        {SEVERITY_LABEL[i.severity]}
                      </span>
                      <span className="rounded bg-black/30 px-1 py-0.5 text-[9px]">
                        {i.category}
                      </span>
                      <span className="text-[9px] opacity-60">
                        {i.location}
                      </span>
                    </div>
                    <div className="mb-0.5">
                      命中：
                      <span className="font-medium">「{i.snippet}」</span>
                    </div>
                    <div className="opacity-90">原因：{i.reason}</div>
                    {i.suggestion && (
                      <div className="mt-0.5 opacity-90">💡 {i.suggestion}</div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompliancePanel;
