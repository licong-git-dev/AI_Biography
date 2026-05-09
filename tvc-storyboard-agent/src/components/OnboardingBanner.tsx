import React from 'react';
import { Check, X } from 'lucide-react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
  useStyleBaselineStore,
  isStyleBaselineConfigured,
} from '../stores';

const OnboardingBanner: React.FC = () => {
  const dismissed = useUIStore((s) => s.onboardingDismissed);
  const dismiss = useUIStore((s) => s.dismissOnboarding);
  const apiKeyPresent = useUIStore((s) => s.apiKeyPresent);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  const baseline = useStyleBaselineStore((s) => s.baseline);
  const charactersWithRef = useCharacterStore(
    (s) => s.characters.filter((c) => c.referenceImageUrl).length
  );
  const userAddedEpisodes = useEpisodeStore(
    (s) => s.episodes.filter((e) => !e.id.startsWith('ep-s1-0')).length
  );
  const anyKeyframe = useShotStore((s) =>
    s.shots.some((x) => x.keyframeUrl)
  );

  if (dismissed) return null;

  const step1Done = apiKeyPresent;
  const step2Done = isStyleBaselineConfigured(baseline);
  const step3Done = charactersWithRef > 0;
  const step4Done = userAddedEpisodes > 0;
  const step5Done = anyKeyframe;

  if (step1Done && step2Done && step3Done && step4Done && step5Done) return null;

  return (
    <div className="shrink-0 border-b border-sepia-900/40 bg-gradient-to-r from-sepia-950/30 via-sepia-950/20 to-sepia-950/30 px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3 overflow-x-auto">
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.15em] text-sepia-300">
            快速上手
          </span>
          <Step
            n={1}
            done={step1Done}
            label="配置 API Key"
            hint="右上角小药丸"
            onClick={openApiKey}
          />
          <span className="text-neutral-700">›</span>
          <Step
            n={2}
            done={step2Done}
            label="设置全片风格基线"
            hint="左栏「风格基线」卡 → 配置 / 套预设"
          />
          <span className="text-neutral-700">›</span>
          <Step
            n={3}
            done={step3Done}
            label="生成角色参考图"
            hint="左栏点角色 → 右栏「生成参考图」"
          />
          <span className="text-neutral-700">›</span>
          <Step
            n={4}
            done={step4Done}
            label="AI 拆集为短剧集"
            hint="中栏「章节」tab 选一章 → 「AI 拆集」"
            onClick={() => setCenterTab('chapters')}
          />
          <span className="text-neutral-700">›</span>
          <Step
            n={5}
            done={step5Done}
            label="生成第一个关键帧"
            hint="中栏「镜头」tab → 任一镜头点开 → 生成"
            onClick={() => setCenterTab('shots')}
          />
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          type="button"
          title="关闭（不再显示）"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

interface StepProps {
  n: number;
  done: boolean;
  label: string;
  hint: string;
  onClick?: () => void;
}

const Step: React.FC<StepProps> = ({ n, done, label, hint, onClick }) => {
  const body = (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
      {done ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-800/80 text-emerald-50 ring-1 ring-emerald-600/40">
          <Check size={10} strokeWidth={3} />
        </span>
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-sepia-600 bg-sepia-900/40 text-[9px] font-medium text-sepia-200">
          {n}
        </span>
      )}
      <span className={done ? 'text-ink-400 line-through' : 'text-sepia-100'}>
        {label}
      </span>
      {!done && <span className="text-[10px] text-sepia-400/70">· {hint}</span>}
    </span>
  );

  if (onClick && !done) {
    return (
      <button
        onClick={onClick}
        className="rounded-md px-1.5 py-0.5 transition hover:bg-sepia-900/30"
        type="button"
      >
        {body}
      </button>
    );
  }
  return body;
};

export default OnboardingBanner;
