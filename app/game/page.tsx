'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';

export default function GamePage() {
  const tick = useGameStore(s => s.tick);
  const last = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;

    const loop = (t: number) => {
      if (last.current == null) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;

      tick(Math.min(dt, 0.25));
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return (
    <div>
      {/* Main game UI goes here later */}
      <h1 className="text-xl font-semibold">Idle Odyssey</h1>
    </div>
  );
}
