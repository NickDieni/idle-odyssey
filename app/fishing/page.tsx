"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/store";
import { getNodesByCategory } from "@/game/nodes";
import { FishingNodeCard } from "@/components/FishingNodeCard";

const fishingNodes = getNodesByCategory("fishing");

export default function FishingPage() {
  const tick = useGameStore((s) => s.tick);



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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">The Fishing Spot</h1>

      {fishingNodes.map((node) => (
        <FishingNodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}
