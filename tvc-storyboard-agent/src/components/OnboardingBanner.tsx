import React from 'react';
import { Check, Circle, X } from 'lucide-react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../stores';

const OnboardingBanner: React.FC = () => {
  const dismissed = useUIStore((s) => s.onboardingDismissed);
  const dismiss = useUIStore((s) => s.dismissOnboarding);
  const apiKeyPresent = useUIStore((s) => s.apiKeyPresent);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

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
  const step2Done = charactersWithRef > 0;
  const step3Done = userAddedEpisodes > 0 || anyKeyframe;

  // 三步都完成后自动隐藏
  if (step1Done && step2Done && step3Done) return null;

  return (
    <div className="shrink-0 border-b border-sky-900/40 bg-sky-950/20 px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-4 overflow-x-auto">
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-sky-300">
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
            label="生成角色参考图"
            hint="左栏点角色 → 右栏「生成参考图」"
          />
          <span className="text-neutral-700">›</span>
          <Step
            n={3}
            done={step3Done}
            label="AI 拆集 + 生成镜头"
            hint="中栏「章节」tab 选一章"
            onClick={() => setCenterTab('chapters')}
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
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-800 text-emerald-100">
          <Check size={10} strokeWidth={3} />
        </span>
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-sky-700 text-[9px] font-medium text-sky-300">
          {n}
        </span>
      )}
      <span className={done ? 'text-neutral-400 line-through' : 'text-neutral-200'}>
        {label}
      </span>
      {!done && <span className="text-[10px] text-neutral-500">· {hint}</span>}
    </span>
  );

  if (onClick && !done) {
    return (
      <button
        onClick={onClick}
        className="rounded px-1 py-0.5 hover:bg-sky-900/30"
        type="button"
      >
        {body}
      </button>
    );
  }
  return body;
};

export default OnboardingBanner;
