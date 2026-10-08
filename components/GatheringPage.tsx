"use client";

import GatherNodeCard from "./GatherNodeCard";
import { getNodesByCategory } from "@/game/nodes";
import { visibleNodes } from "@/game/progression";
import { useGameStore } from "@/game/store";

export default function GatheringPage({ category, title }: {
  category: "woodcutting" | "mining";
  title: string;
}) {
  const resources = useGameStore((state) => state.resources);
  const discovered = useGameStore((state) => state.discovered);
  const unlockedNodes = useGameStore((state) => state.unlockedNodes);
  const nodes = visibleNodes(getNodesByCategory(category), resources, discovered, unlockedNodes);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex flex-wrap gap-4">
        {nodes.map((node) => <GatherNodeCard key={node.id} node={node} />)}
      </div>
    </div>
  );
}
