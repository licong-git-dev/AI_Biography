import React from 'react';

const LeftPanel: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Project</div>
        <div className="text-sm font-semibold">《李聪传》AI 短剧生产工作台</div>
        <div className="text-xs text-neutral-400 mt-1">v0.1 · Phase 0 骨架</div>
      </div>

      <Section title="角色卡" placeholder="Phase 3 填充 · 李聪 5 个年龄段 + 配角" />
      <Section title="风格设定" placeholder="Phase 2 填充 · 画风 / 色调 / 镜头语言" />
      <Section title="素材来源" placeholder="9 章书稿 / 人物圣经 / 3 样片骨架" />
    </div>
  );
};

const Section: React.FC<{ title: string; placeholder: string }> = ({ title, placeholder }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
    <div className="text-xs text-neutral-600 italic">{placeholder}</div>
  </div>
);

export default LeftPanel;
