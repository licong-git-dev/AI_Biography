import React from 'react';

const RightPanel: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <Section title="AI 任务面板" placeholder="Phase 4-5 · 章节拆集 / 角色一致性 / 关键帧" />
      <Section title="输出预览" placeholder="Phase 5 · 当前镜头 / 当前片段 / 当前成片" />
      <Section title="发布准备" placeholder="第三批 · 标题 / 简介 / 标签 / 封面 / 平台版本" />
    </div>
  );
};

const Section: React.FC<{ title: string; placeholder: string }> = ({ title, placeholder }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
    <div className="text-xs text-neutral-600 italic">{placeholder}</div>
  </div>
);

export default RightPanel;
