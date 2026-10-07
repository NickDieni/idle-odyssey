"use client";

import GatherNodeCard from "@/components/GatherNodeCard";
import { useGameStore } from "@/game/store";
import { visibleNodes } from "@/game/progression";
import { getNodesByCategory } from "@/game/nodes";
const nodes = getNodesByCategory("woodcutting");

export default function WoodcuttingPage() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);
  const unlockedNodes = useGameStore((s) => s.unlockedNodes);

  const nodesToShow = visibleNodes(nodes, resources, discovered, unlockedNodes);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">The Forrest</h1>

      <div className="flex flex-wrap gap-4">
        {nodesToShow.map((node) => (
          <GatherNodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
