import React, { useState } from 'react';
import { Palette, Pencil } from 'lucide-react';
import {
  useStyleBaselineStore,
  isStyleBaselineConfigured,
} from '../../stores';
import StyleBaselineModal from './StyleBaselineModal';

const StyleBaselineSection: React.FC = () => {
  const baseline = useStyleBaselineStore((s) => s.baseline);
  const [open, setOpen] = useState(false);
  const configured = isStyleBaselineConfigured(baseline);

  return (
    <>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label-stamp text-[10px] text-sepia-400/70">
            <Palette size={10} className="-mt-0.5 mr-1 inline" />
            风格基线
          </span>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-0.5 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:border-sepia-700 hover:text-sepia-200"
            type="button"
            title={configured ? '编辑全片风格基线' : '配置全片风格基线'}
          >
            <Pencil size={10} /> {configured ? '编辑' : '配置'}
          </button>
        </div>

        {configured ? (
          <div className="rounded-md border border-sepia-900/30 bg-sepia-950/10 p-2 space-y-1 text-[10px]">
            {baseline.visualStyle && (
              <Row label="画风" value={baseline.visualStyle} />
            )}
            {baseline.colorTone && (
              <Row label="色调" value={baseline.colorTone} />
            )}
            {baseline.cinematography && (
              <Row label="镜头" value={baseline.cinematography} />
            )}
            {baseline.era && <Row label="时代" value={baseline.era} />}
            {baseline.costumeKeywords.length > 0 && (
              <Row
                label="服化道"
                value={baseline.costumeKeywords.join('、')}
              />
            )}
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-md border border-dashed border-sepia-900/40 bg-sepia-950/5 p-2 text-left text-[10px] text-sepia-500/70 hover:border-sepia-700/60 hover:text-sepia-300"
            type="button"
          >
            尚未配置 — 点击设置全片画风/色调/时代背景，所有 AI 出图自动遵守
          </button>
        )}
      </div>

      <StyleBaselineModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-1.5">
    <span className="shrink-0 text-sepia-500/70">{label}：</span>
    <span className="text-sepia-100/90 line-clamp-2">{value}</span>
  </div>
);

export default StyleBaselineSection;
