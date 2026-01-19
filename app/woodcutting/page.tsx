"use client";

import GatherNodeCard, { type GatherNode } from "@/components/GatherNodeCard";
import { useGameStore } from "@/game/store";
import { visibleNodes } from "@/game/progression";

// How to set up new woodcutting nodes
// id = unique string identifier
// actionVerb = what the action is called ("Cut", "Mine", etc.)
// label = display name of the node
// resourceId = what resource you gain (wood/birch/etc.)
// iconSrc = optional icon image path
// xp = how much XP you gain per action
// durationSeconds = how long the action takes
// rewardAmount = how much resource you gain per action
// requirement = unlock requirement to access this node
const WOODCUTTING_NODES: GatherNode[] = [
  {
    id: "tree.oak",
    actionVerb: "Cut",
    label: "Oak Tree",
    resourceId: "oak",
    iconSrc: "/icons/oak.png", // optional
    xp: 10,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "none" },
  },
  {
    id: "tree.birch",
    actionVerb: "Cut",
    label: "Birch Tree",
    resourceId: "birch",
    iconSrc: "/icons/birch.png", // optional
    xp: 25,
    durationSeconds: 4,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "oak", amount: 15 }, // previous resource requirement
  },
  {
    id: "tree.spruce",
    actionVerb: "Cut",
    label: "Spruce Tree",
    resourceId: "spruce",
    //iconSrc: "/icons/spruce.png", // optional
    xp: 50,
    durationSeconds: 5,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "birch", amount: 30 }, // previous resource requirement
  },
];

export default function WoodcuttingPage() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);

  const nodesToShow = visibleNodes(WOODCUTTING_NODES, resources, discovered);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Woodcutting</h1>

      <div className="flex flex-wrap gap-4">
        {nodesToShow.map((node) => (
          <GatherNodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
