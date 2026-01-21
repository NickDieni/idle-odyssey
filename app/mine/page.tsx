'use client';

import GatherNodeCard from "@/components/GatherNodeCard";
import { useGameStore } from "@/game/store";
import { visibleNodes } from "@/game/progression";
import { getNodesByCategory } from "@/game/nodes";
const nodes = getNodesByCategory("mining");

export default function MinePage() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);

  const nodesToShow = visibleNodes(nodes, resources, discovered);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">The Mines</h1>

      <div className="flex flex-wrap gap-4">
        {nodesToShow.map((node) => (
          <GatherNodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}