import React from 'react';

const CenterPanel: React.FC = () => {
  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">分镜 &amp; 时间线</h1>
        <p className="text-sm text-neutral-400 mt-1">
          集数视图 / 镜头表视图 / 时间线视图 · Phase 4 填充
        </p>
      </header>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="text-lg font-medium mb-2">Phase 0 骨架已就绪</h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          三栏布局已搭建。下一步：Phase 1 数据模型 + 内置数据。
        </p>
        <ul className="text-xs text-neutral-500 mt-6 space-y-1 inline-block text-left">
          <li>✓ src/ 目录树建立</li>
          <li>✓ 数据文件复制到 public/data/</li>
          <li>✓ Zustand 已安装</li>
          <li>✓ Vite 配置 raw 导入支持</li>
        </ul>
      </div>
    </div>
  );
};

export default CenterPanel;
