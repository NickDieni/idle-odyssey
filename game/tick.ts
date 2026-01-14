'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';

export default function GamePage() {
  const tick = useGameStore(s => s.tick);
  const gold = useGameStore(s => s.resources.gold);
  const goldPerSec = useGameStore(s => s.getStat('prod.gold'));

  const last = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;

    const loop = (t: number) => {
      if (last.current == null) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;

      // clamp dt to avoid huge jumps if tab was inactive
      tick(Math.min(dt, 0.25));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return (
    <div>
      <div className="text-xl font-semibold">Idle Odyssey</div>
      <div className="mt-2 text-gray-300">Gold: {Math.floor(gold)}</div>
      <div className="text-gray-400">Gold/sec: {goldPerSec.toFixed(2)}</div>
    </div>
  );
}
