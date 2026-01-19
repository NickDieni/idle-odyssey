'use client';

import { useGameStore } from '@/game/store';
import { getLevelInfo } from '@/game/leveling';

export default function LevelBar() {
  const xp = useGameStore((s) => s.resources.xp ?? 0);
  const info = getLevelInfo(xp);

  const pct = Math.max(0, Math.min(100, Math.floor(info.progress01 * 100)));

  return (
    <div className="px-6 py-3 border-b border-gray-800">
      <div className="text-xs text-gray-400 mb-2">
        Level {info.level}
      </div>

      <div className="relative h-5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-sky-500"
          style={{ width: `${pct}%` }}
        />

        {/* Text INSIDE the bar */}
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
          {info.xpIntoLevel.toLocaleString()} / {info.xpForNextLevel.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
}
