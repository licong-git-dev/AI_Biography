import React, { useEffect, useState } from 'react';
import { estimateStorageUsage, evictBase64Images } from '../services/storageHealth';

const StorageIndicator: React.FC = () => {
  const [health, setHealth] = useState(() => estimateStorageUsage());

  useEffect(() => {
    const refresh = () => setHealth(estimateStorageUsage());
    refresh();
    const t = setInterval(refresh, 15000); // 每 15 秒刷新一次
    window.addEventListener('storage', refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!health.near) return null;

  const handleEvict = () => {
    if (
      !confirm(
        `即将移除所有已生成的角色参考图和镜头关键帧（约 ${health.usedMB} MB）。结构化数据（角色文本、集数、镜头描述）会保留。继续？`
      )
    ) {
      return;
    }
    const freed = evictBase64Images();
    setHealth(estimateStorageUsage());
    alert(`已释放约 ${(freed / 1024 / 1024).toFixed(2)} MB。刷新页面以重新加载。`);
  };

  return (
    <button
      onClick={handleEvict}
      className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] ${
        health.critical
          ? 'border-red-800 bg-red-950/40 text-red-300 hover:border-red-700'
          : 'border-amber-800 bg-amber-950/30 text-amber-300 hover:border-amber-700'
      }`}
      type="button"
      title={`localStorage 已用 ${health.usedMB} MB / ~${health.hardLimitMB} MB。点击释放参考图和关键帧。`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      存储 {health.usedMB}MB
    </button>
  );
};

export default StorageIndicator;
