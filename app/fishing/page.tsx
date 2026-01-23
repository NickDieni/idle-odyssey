"use client";

import { useEffect, useMemo } from "react";
import { useGameStore } from "@/game/store";
import { getNodesByCategory } from "@/game/nodes";
import type { FishingNode } from "@/game/types";
import { FishingNodeCard } from "@/components/FishingNodeCard";

export default function FishingPage() {
  const tick = useGameStore((s) => s.tick);

  const fishingNodes = useMemo(() => {
    return getNodesByCategory("fishing").filter(
      (n): n is FishingNode => n.category === "fishing"
    );
  }, []);

  useEffect(() => {
    let last = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Fishing</h1>

      {fishingNodes.map((node) => (
        <FishingNodeCard key={node.id} node={node} />
      ))}
    </main>
  );
}
