import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useCharacterStore, useShotStore } from '../../stores';

interface CharacterRow {
  id: string;
  name: string;
  group: string;
  shotCount: number;
  totalSeconds: number;
}

const CharacterBalanceCard: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const shots = useShotStore((s) => s.shots);

  const rows = useMemo<CharacterRow[]>(() => {
    return characters
      .map((c) => {
        const involvedShots = shots.filter((s) => s.characters.includes(c.id));
        return {
          id: c.id,
          name: c.name,
          group: c.group,
          shotCount: involvedShots.length,
          totalSeconds: involvedShots.reduce((a, s) => a + s.duration, 0),
        };
      })
      .sort((a, b) => b.shotCount - a.shotCount);
  }, [characters, shots]);

  if (rows.length === 0) return null;

  const maxShots = Math.max(1, ...rows.map((r) => r.shotCount));
  const orphans = rows.filter((r) => r.shotCount === 0);
  const totalShots = rows.reduce((a, r) => a + r.shotCount, 0);

  return (
    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <Users size={12} />
          角色戏份均衡
        </span>
        <span className="text-[10px] text-neutral-500">
          总出场 {totalShots} 镜次 · {orphans.length} 个角色 0 出场
        </span>
      </div>

      <div className="space-y-1">
        {rows.map((r) => {
          const pct = (r.shotCount / maxShots) * 100;
          const orphan = r.shotCount === 0;
          return (
            <div key={r.id} className="flex items-center gap-2 text-[11px]">
              <span
                className={`w-20 shrink-0 truncate ${
                  orphan ? 'text-amber-400' : 'text-neutral-300'
                }`}
                title={`${r.name} · ${r.group}`}
              >
                {r.name}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full transition-all ${
                    orphan
                      ? 'bg-amber-700'
                      : r.shotCount >= 8
                        ? 'bg-emerald-600'
                        : r.shotCount >= 3
                          ? 'bg-sky-600'
                          : 'bg-neutral-600'
                  }`}
                  style={{ width: `${Math.max(orphan ? 4 : 1, pct)}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-neutral-400">
                {r.shotCount}
              </span>
              <span className="w-12 shrink-0 text-right font-mono text-neutral-500">
                {r.totalSeconds}s
              </span>
            </div>
          );
        })}
      </div>

      {orphans.length > 0 && (
        <p className="mt-2 text-[10px] text-amber-400">
          {orphans.length} 个角色没在任何镜头里出场（{orphans.map((o) => o.name).slice(0, 3).join('、')}{orphans.length > 3 ? ' 等' : ''}）。可能是孤儿角色卡。
        </p>
      )}
    </div>
  );
};

export default CharacterBalanceCard;
