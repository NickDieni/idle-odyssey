"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/game/store";

export default function GameTicker() {
  const tick = useGameStore((s) => s.tick);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    lastRef.current = Date.now();
    let raf = 0;

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      tick(dt);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return null;
}
